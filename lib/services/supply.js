import { withTransaction } from '../db.js';
import { AppError } from '../errors.js';
import { logActivity, notifyRole, notifySupplier } from '../audit.js';

/**
 * 1. Manager Gudang membuat Restock Order (PO) kepada Supplier (status awal: pending).
 * Tidak mengubah stok.
 */
export async function createSupplyOrder(user, input) {
  if (user.role !== 'manager') {
    throw new AppError('Hanya Manager Gudang yang dapat membuat Restock Order (PO) ke Supplier.');
  }
  return withTransaction(async (client) => {
    const supRes = await client.query(
      "SELECT id, company_name FROM suppliers WHERE id = $1 AND is_active = TRUE AND verification_status = 'approved'",
      [input.supplier_id],
    );
    const supplier = supRes.rows[0];
    if (!supplier) {
      throw new AppError('Supplier tidak ditemukan atau belum aktif/terverifikasi.', 'supplier_id');
    }

    const ids = input.items.map((i) => i.product_id);
    const found = await client.query('SELECT id FROM products WHERE id = ANY($1::int[]) AND is_active = TRUE', [ids]);
    if (found.rowCount !== ids.length) throw new AppError('Salah satu produk tidak ditemukan atau nonaktif.', 'items');

    const ins = await client.query(
      `INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status)
       VALUES ('PO-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(nextval('seq_supply_order')::text, 4, '0'),
               $1, $2, $3, $4, $5, 'pending')
       RETURNING id, order_number`,
      [supplier.id, user.id, input.order_date, input.expected_date, input.notes],
    );
    const { id, order_number } = ins.rows[0];

    await client.query(
      `INSERT INTO supply_order_items (supply_order_id, product_id, quantity)
       SELECT $1, x.product_id, x.quantity FROM unnest($2::int[], $3::numeric[]) AS x(product_id, quantity)`,
      [id, ids, input.items.map((i) => i.quantity)],
    );

    const totalQty = input.items.reduce((a, i) => a + i.quantity, 0);
    await logActivity(client, {
      actor: user,
      action: 'create_supply_order',
      entityType: 'supply_order',
      entityId: id,
      summary: `Manager ${user.name} membuat Restock Order ${order_number} (${totalQty} kg) kepada ${supplier.company_name}.`,
    });
    await notifySupplier(client, supplier.id, {
      title: `Restock Order (PO) Baru (${order_number})`,
      message: `Manager Gudang mengirim PO ${totalQty} kg. Silakan konfirmasi kesanggupan Anda.`,
      link: `/supply-orders/${id}`,
    });
    return id;
  });
}

/**
 * 2. Supplier mengonfirmasi (Confirmed) atau menolak (Rejected + alasan wajib) PO dari Manager.
 */
export async function decideSupplyOrder(user, orderId, decision, rejectReason) {
  if (user.role !== 'supplier' || !user.supplier_id) {
    throw new AppError('Hanya Supplier terkait yang dapat mengonfirmasi atau menolak Restock Order.');
  }
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT so.*, s.company_name
         FROM supply_orders so
         JOIN suppliers s ON s.id = so.supplier_id
        WHERE so.id = $1 FOR UPDATE`,
      [orderId],
    );
    const so = rows[0];
    if (!so) throw new AppError('Restock Order tidak ditemukan.');
    if (so.supplier_id !== user.supplier_id) throw new AppError('Anda tidak memiliki akses ke pesanan ini.');
    if (so.status !== 'pending') throw new AppError('Pesanan ini sudah dikonfirmasi sebelumnya.');

    if (decision === 'reject') {
      if (!rejectReason || rejectReason.trim().length < 3) {
        throw new AppError('Alasan penolakan wajib diisi minimal 3 karakter.', 'reason');
      }
      await client.query(
        `UPDATE supply_orders
            SET status = 'rejected', reject_reason = $1, decision_by = $2, decision_at = NOW(), updated_at = NOW()
          WHERE id = $3`,
        [rejectReason.trim(), user.id, orderId],
      );
      await logActivity(client, {
        actor: user,
        action: 'reject_supply_order',
        entityType: 'supply_order',
        entityId: orderId,
        summary: `${so.company_name} menolak PO ${so.order_number}: ${rejectReason.trim()}`,
      });
      await notifyRole(client, 'manager', {
        title: `PO ${so.order_number} Ditolak Supplier`,
        message: `${so.company_name} menolak pesanan. Alasan: ${rejectReason.trim()}`,
        link: `/supply-orders/${orderId}`,
      });
      return;
    }

    await client.query(
      `UPDATE supply_orders
          SET status = 'confirmed', decision_by = $1, decision_at = NOW(), updated_at = NOW()
        WHERE id = $2`,
      [user.id, orderId],
    );
    await logActivity(client, {
      actor: user,
      action: 'confirm_supply_order',
      entityType: 'supply_order',
      entityId: orderId,
      summary: `${so.company_name} mengonfirmasi PO ${so.order_number}.`,
    });
    await notifyRole(client, 'manager', {
      title: `PO ${so.order_number} Dikonfirmasi`,
      message: `${so.company_name} menyanggupi pesanan dan siap mengirim barang.`,
      link: `/supply-orders/${orderId}`,
    });
  });
}

/**
 * 3. Supplier langsung mengirim barang: Confirmed -> In Transit (wajib unggah foto bukti kirim).
 */
export async function dispatchSupplyOrder(user, orderId, proofUrl, notes = '') {
  if (user.role !== 'supplier' || !user.supplier_id) {
    throw new AppError('Hanya Supplier terkait yang dapat mengirim barang.');
  }
  if (!proofUrl) {
    throw new AppError('Foto bukti kirim wajib diunggah sebelum mengubah status ke In Transit.', 'proof_image');
  }
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM supply_orders WHERE id = $1 FOR UPDATE', [orderId]);
    const so = rows[0];
    if (!so) throw new AppError('Restock Order tidak ditemukan.');
    if (so.supplier_id !== user.supplier_id) throw new AppError('Anda tidak memiliki akses ke pesanan ini.');
    if (so.status !== 'confirmed') throw new AppError('Pesanan harus berstatus Confirmed sebelum dikirim (In Transit).');

    const { rows: existing } = await client.query(
      'SELECT COALESCE(MAX(attempt_number), 0)::int AS max_attempt FROM shipments WHERE supply_order_id = $1',
      [orderId],
    );
    const attemptNumber = (existing[0]?.max_attempt || 0) + 1;

    const ins = await client.query(
      `INSERT INTO shipments
         (shipment_number, supply_order_id, attempt_number, shipment_type, status, shipping_proof_url, notes, shipped_at, created_by)
       VALUES ('SHP-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(nextval('seq_shipment')::text, 4, '0'),
               $1, $2, 'initial', 'in_transit', $3, $4, NOW(), $5)
       RETURNING id, shipment_number`,
      [orderId, attemptNumber, proofUrl, notes.trim(), user.id],
    );
    const shp = ins.rows[0];

    await client.query("UPDATE supply_orders SET status = 'in_transit', updated_at = NOW() WHERE id = $1", [orderId]);

    await logActivity(client, {
      actor: user,
      action: 'ship_in_transit',
      entityType: 'shipment',
      entityId: shp.id,
      summary: `${user.company_name || user.name} mengirim barang ${shp.shipment_number} (${so.order_number}) — status In Transit.`,
    });
    await notifyRole(client, 'manager', {
      title: `Pengiriman Dalam Perjalanan (${so.order_number})`,
      message: `Supplier mengirim barang (${shp.shipment_number}) disertai foto bukti kirim.`,
      link: `/supply-orders/${orderId}`,
    });
    return shp.id;
  });
}

/**
 * 4A. Supplier menyerahkan bukti foto dokumentasi kedatangan barang: In Transit -> Arrived.
 */
export async function markShipmentArrived(user, shipmentId, proofUrl, notes = '') {
  if (user.role !== 'supplier' || !user.supplier_id) {
    throw new AppError('Hanya Supplier terkait yang dapat mengunggah bukti kedatangan barang.');
  }
  if (!proofUrl) {
    throw new AppError('Foto bukti dokumentasi kedatangan barang wajib diunggah.', 'proof_image');
  }
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT sh.*, so.supplier_id, so.order_number
         FROM shipments sh
         JOIN supply_orders so ON so.id = sh.supply_order_id
        WHERE sh.id = $1 FOR UPDATE`,
      [shipmentId],
    );
    const sh = rows[0];
    if (!sh) throw new AppError('Pengiriman tidak ditemukan.');
    if (sh.supplier_id !== user.supplier_id) throw new AppError('Anda tidak berhak mengubah pengiriman ini.');
    if (sh.status !== 'in_transit') throw new AppError('Status pengiriman harus In Transit sebelum menandai barang tiba.');

    await client.query(
      `UPDATE shipments
          SET status = 'arrived',
              arrival_proof_url = $1,
              notes = CASE WHEN $2 <> '' THEN $2 ELSE notes END,
              arrived_at = NOW(),
              updated_at = NOW()
        WHERE id = $3`,
      [proofUrl, notes.trim(), shipmentId],
    );
    await client.query("UPDATE supply_orders SET status = 'arrived', updated_at = NOW() WHERE id = $1", [sh.supply_order_id]);

    await logActivity(client, {
      actor: user,
      action: 'shipment_arrived',
      entityType: 'shipment',
      entityId: shipmentId,
      summary: `${sh.shipment_number} (${sh.order_number}) telah tiba di gudang disertai foto dokumentasi kedatangan.`,
    });
    await notifyRole(client, 'manager', {
      title: `Barang Tiba di Gudang (${sh.order_number})`,
      message: `Bukti kedatangan ${sh.shipment_number} telah diterima. Silakan instruksikan Staff untuk pemeriksaan fisik.`,
      link: `/supply-orders/${sh.supply_order_id}`,
    });
  });
}

/**
 * 4B. Manager menginstruksikan Staff Gudang memeriksa fisik barang: Arrived -> Inspecting.
 */
export async function instructInspection(user, shipmentId, notes = '') {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT sh.*, so.order_number
         FROM shipments sh
         JOIN supply_orders so ON so.id = sh.supply_order_id
        WHERE sh.id = $1 FOR UPDATE`,
      [shipmentId],
    );
    const sh = rows[0];
    if (!sh) throw new AppError('Pengiriman tidak ditemukan.');
    if (sh.status !== 'arrived') throw new AppError('Instruksi pemeriksaan hanya dapat diberikan saat barang sudah tiba (Arrived).');

    await client.query("UPDATE shipments SET status = 'inspecting', updated_at = NOW() WHERE id = $1", [shipmentId]);
    await client.query("UPDATE supply_orders SET status = 'inspecting', updated_at = NOW() WHERE id = $1", [sh.supply_order_id]);

    const ins = await client.query(
      `INSERT INTO inspections (shipment_id, instructed_by, instructed_at, status, notes)
       VALUES ($1, $2, NOW(), 'pending', $3)
       ON CONFLICT (shipment_id) DO UPDATE SET instructed_by = EXCLUDED.instructed_by, instructed_at = NOW(), updated_at = NOW()
       RETURNING id`,
      [shipmentId, user.id, notes.trim() || null],
    );

    await logActivity(client, {
      actor: user,
      action: 'instruct_inspection',
      entityType: 'inspection',
      entityId: ins.rows[0].id,
      summary: `Manager menginstruksikan pemeriksaan fisik kepada Staff Gudang untuk ${sh.order_number} (Status: Inspecting).`,
    });
    await notifyRole(client, 'staff', {
      title: `Instruksi Pemeriksaan — ${sh.order_number}`,
      message: `Manager meminta pemeriksaan fisik untuk ${sh.shipment_number}. Unggah foto bukti pemeriksaan.`,
      link: `/inspections/${shipmentId}`,
    });
  });
}

/**
 * 4C. Staff mengirim laporan pemeriksaan fisik (jumlah & kondisi) + foto bukti wajib.
 */
export async function submitInspection(user, shipmentId, { items, notes, photoUrl, photoCaption }) {
  if (!photoUrl) {
    throw new AppError('Foto bukti pemeriksaan wajib diunggah untuk hasil Sesuai maupun Tidak Sesuai.', 'photo');
  }
  return withTransaction(async (client) => {
    const { rows: shRows } = await client.query(
      `SELECT sh.*, so.order_number
         FROM shipments sh JOIN supply_orders so ON so.id = sh.supply_order_id
        WHERE sh.id = $1 FOR UPDATE`,
      [shipmentId],
    );
    const sh = shRows[0];
    if (!sh) throw new AppError('Pengiriman tidak ditemukan.');
    if (sh.status !== 'inspecting') throw new AppError('Pesanan ini tidak sedang dalam tahap pemeriksaan (Inspecting).');

    const { rows: inspRows } = await client.query('SELECT * FROM inspections WHERE shipment_id = $1 FOR UPDATE', [shipmentId]);
    const insp = inspRows[0];
    if (!insp) throw new AppError('Data pemeriksaan belum diinisiasi oleh Manager.');
    if (insp.status === 'submitted') throw new AppError('Laporan pemeriksaan untuk pengiriman ini sudah dikirim.');

    const { rows: orderedItems } = await client.query(
      'SELECT product_id, quantity FROM supply_order_items WHERE supply_order_id = $1 ORDER BY id',
      [sh.supply_order_id],
    );
    const mapInput = new Map(items.map((it) => [Number(it.product_id), it]));

    let allSesuai = true;
    await client.query('DELETE FROM inspection_items WHERE inspection_id = $1', [insp.id]);

    for (const ord of orderedItems) {
      const inp = mapInput.get(ord.product_id);
      if (!inp) throw new AppError('Semua item pada PO wajib diperiksa.');
      const actual = Math.round(Number(inp.actual_qty) * 100) / 100;
      if (Number.isNaN(actual) || actual < 0) throw new AppError('Kuantitas aktual tidak valid.');
      const ordered = Number(ord.quantity);
      const itemResult = inp.result === 'sesuai' && actual === ordered ? 'sesuai' : 'tidak_sesuai';
      if (itemResult !== 'sesuai') allSesuai = false;

      await client.query(
        `INSERT INTO inspection_items (inspection_id, product_id, ordered_qty, actual_qty, result, notes)
         VALUES ($1, $2, $3, $4, $5, '')`,
        [insp.id, ord.product_id, ordered, actual, itemResult],
      );
    }

    const overall = allSesuai ? 'sesuai' : 'tidak_sesuai';
    await client.query(
      `UPDATE inspections
          SET inspector_id = $1, status = 'submitted', overall_result = $2, notes = $3, submitted_at = NOW(), updated_at = NOW()
        WHERE id = $4`,
      [user.id, overall, notes.trim(), insp.id],
    );
    await client.query(
      `INSERT INTO inspection_photos (inspection_id, image_url, caption, uploaded_by)
       VALUES ($1, $2, $3, $4)`,
      [insp.id, photoUrl, photoCaption?.trim() || 'Foto bukti pemeriksaan fisik', user.id],
    );

    await logActivity(client, {
      actor: user,
      action: 'submit_inspection',
      entityType: 'inspection',
      entityId: insp.id,
      summary: `Staff ${user.name} mengirim laporan pemeriksaan ${sh.order_number} (Hasil: ${overall === 'sesuai' ? 'Sesuai' : 'Tidak Sesuai'}).`,
    });
    await notifyRole(client, 'manager', {
      title: `Laporan Pemeriksaan Masuk (${sh.order_number})`,
      message:
        overall === 'sesuai'
          ? 'Hasil pemeriksaan Staff: Sesuai. Menunggu Staff mengajukan Incoming Transaction.'
          : 'Hasil pemeriksaan Staff: Tidak Sesuai. Silakan tolak penerimaan (Returned) & ajukan klaim refund.',
      link: `/supply-orders/${sh.supply_order_id}`,
    });
    return { inspectionId: insp.id, overallResult: overall };
  });
}

/**
 * 5 (Skenario 2) — Manager menolak penerimaan barang yang tidak sesuai / rusak:
 * Status PO -> Returned (alasan wajib), transaksi masuk terkait (jika ada) -> Rejected,
 * mencatat klaim refund ke Supplier, stok gudang tetap tidak berubah.
 * Manager diarahkan membuat Restock Order (PO) baru apabila stok masih dibutuhkan.
 */
export async function returnSupplyOrder(user, inspectionId, reason, refundInstructions = '') {
  if (user.role !== 'manager') {
    throw new AppError('Hanya Manager Gudang yang berwenang menolak penerimaan & mengajukan klaim refund.');
  }
  if (!reason || reason.trim().length < 3) {
    throw new AppError('Alasan penolakan / retur wajib diisi minimal 3 karakter.', 'decision_notes');
  }
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT i.*, sh.supply_order_id, sh.shipment_number, sh.status AS shipment_status,
              so.supplier_id, so.order_number
         FROM inspections i
         JOIN shipments sh ON sh.id = i.shipment_id
         JOIN supply_orders so ON so.id = sh.supply_order_id
        WHERE i.id = $1 FOR UPDATE`,
      [inspectionId],
    );
    const insp = rows[0];
    if (!insp) throw new AppError('Laporan pemeriksaan tidak ditemukan.');
    if (insp.status !== 'submitted') throw new AppError('Staff belum mengirimkan laporan pemeriksaan.');
    if (insp.shipment_status === 'received') throw new AppError('Pesanan sudah berstatus Received dan tidak dapat diretur.');
    if (insp.shipment_status === 'returned') throw new AppError('Pesanan ini sudah berstatus Returned.');

    const cleanReason = reason.trim();
    await client.query(
      `UPDATE inspections
          SET manager_decision = 'refund', decision_by = $1, decision_at = NOW(), decision_notes = $2, updated_at = NOW()
        WHERE id = $3`,
      [user.id, cleanReason, inspectionId],
    );
    await client.query("UPDATE shipments SET status = 'returned', updated_at = NOW() WHERE id = $1", [insp.shipment_id]);
    await client.query(
      `UPDATE supply_orders
          SET status = 'returned', reject_reason = $1, updated_at = NOW()
        WHERE id = $2`,
      [cleanReason, insp.supply_order_id],
    );
    await client.query(
      `UPDATE inventory_transactions
          SET status = 'rejected', reject_reason = $1, approved_by = $2, decided_at = NOW(), updated_at = NOW()
        WHERE inspection_id = $3 AND status = 'pending'`,
      [cleanReason, user.id, inspectionId],
    );
    await client.query(
      `INSERT INTO returns (shipment_id, supply_order_id, reason, instructions, status, initiated_by, returned_at, confirmed_by)
       VALUES ($1, $2, $3, $4, 'returned', $5, NOW(), $5)
       ON CONFLICT (shipment_id) DO UPDATE SET reason = EXCLUDED.reason, instructions = EXCLUDED.instructions, updated_at = NOW()`,
      [insp.shipment_id, insp.supply_order_id, cleanReason, refundInstructions.trim(), user.id],
    );

    await logActivity(client, {
      actor: user,
      action: 'return_supply_order',
      entityType: 'supply_order',
      entityId: insp.supply_order_id,
      summary: `Manager menolak penerimaan ${insp.order_number} (Status: Returned) & mengajukan klaim refund: ${cleanReason}`,
    });
    await notifySupplier(client, insp.supplier_id, {
      title: `PO ${insp.order_number} Diretur & Klaim Refund`,
      message: `Penerimaan ditolak (Returned). Alasan: ${cleanReason}.`,
      link: `/supply-orders/${insp.supply_order_id}`,
    });
    await notifyRole(client, 'staff', {
      title: `PO ${insp.order_number} Diretur (Returned)`,
      message: `Manager menolak penerimaan ${insp.shipment_number}: ${cleanReason}. Stok tidak berubah.`,
      link: `/inspections`,
    });
  });
}

/**
 * Manager Gudang menghapus Restock Order (PO) yang masih berstatus Pending.
 */
export async function deletePendingSupplyOrder(user, orderId) {
  if (user.role !== 'manager') {
    throw new AppError('Hanya Manager Gudang yang dapat menghapus permintaan pasokan berstatus Pending.');
  }
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM supply_orders WHERE id = $1 FOR UPDATE', [orderId]);
    const so = rows[0];
    if (!so) throw new AppError('Permintaan pasokan tidak ditemukan.');
    if (so.status !== 'pending') {
      throw new AppError('Hanya permintaan pasokan berstatus Pending yang dapat dihapus.');
    }

    await client.query('DELETE FROM supply_orders WHERE id = $1', [orderId]);
    await logActivity(client, {
      actor: user,
      action: 'delete_supply_order',
      entityType: 'supply_order',
      entityId: orderId,
      summary: `Manager ${user.name} menghapus permintaan pasokan Pending ${so.order_number}.`,
    });
    return so.order_number;
  });
}
