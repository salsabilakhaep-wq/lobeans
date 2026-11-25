import { withTransaction } from '../db.js';
import { AppError } from '../errors.js';
import { logActivity, notifyRole, notifySupplier } from '../audit.js';

/**
 * Staff Gudang membuat Incoming Transaction berdasarkan PO yang lolos pemeriksaan (Sesuai).
 * Status awal: Pending (stok BELUM bertambah).
 * Satu Nomor PO hanya dapat dipakai oleh 1 Incoming Transaction yang tidak berstatus Rejected.
 */
export async function createIncomingTransaction(user, input) {
  if (user.role !== 'staff') {
    throw new AppError('Catatan barang masuk diajukan oleh Staff Gudang setelah pemeriksaan selesai.');
  }
  return withTransaction(async (client) => {
    const { rows: inspRows } = await client.query(
      `SELECT i.*, sh.id AS shipment_id, sh.shipment_number, sh.supply_order_id, sh.status AS shipment_status,
              so.order_number, so.supplier_id, so.status AS order_status, s.company_name AS supplier_name
         FROM inspections i
         JOIN shipments sh ON sh.id = i.shipment_id
         JOIN supply_orders so ON so.id = sh.supply_order_id
         JOIN suppliers s ON s.id = so.supplier_id
        WHERE i.id = $1 FOR UPDATE`,
      [input.inspection_id],
    );
    const insp = inspRows[0];
    if (!insp) throw new AppError('Data hasil pemeriksaan PO tidak ditemukan.', 'inspection_id');
    if (insp.status !== 'submitted') throw new AppError('Pemeriksaan fisik belum diselesaikan.');
    if (insp.overall_result !== 'sesuai') {
      throw new AppError('Hanya hasil pemeriksaan berstatus Sesuai yang dapat diajukan sebagai Barang Masuk (IN).');
    }
    if (insp.order_status === 'returned' || insp.order_status === 'received') {
      throw new AppError('PO ini sudah selesai diproses.');
    }

    const dup = await client.query(
      "SELECT id FROM inventory_transactions WHERE supply_order_id = $1 AND type = 'IN' AND status <> 'rejected'",
      [insp.supply_order_id],
    );
    if (dup.rowCount > 0) {
      throw new AppError('Nomor PO ini sudah memiliki transaksi Barang Masuk yang aktif.');
    }

    const { rows: inspItems } = await client.query(
      'SELECT product_id, ordered_qty, actual_qty, result FROM inspection_items WHERE inspection_id = $1 ORDER BY id',
      [insp.id],
    );
    if (
      inspItems.length === 0 ||
      !inspItems.every((it) => it.result === 'sesuai' && Number(it.actual_qty) === Number(it.ordered_qty))
    ) {
      throw new AppError('Seluruh item hasil pemeriksaan harus berstatus Sesuai dan kuantitas aktual cocok.');
    }

    await client.query(
      "UPDATE inventory_transactions SET inspection_id = NULL WHERE inspection_id = $1 AND status = 'rejected'",
      [insp.id],
    );

    const { rows: photos } = await client.query(
      'SELECT image_url FROM inspection_photos WHERE inspection_id = $1 ORDER BY id ASC LIMIT 1',
      [insp.id],
    );

    const ins = await client.query(
      `INSERT INTO inventory_transactions
         (trx_number, type, trx_date, inspection_id, supply_order_id, shipment_id, supplier_id, notes, proof_image_url, status, created_by)
       VALUES ('TRX-IN-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(nextval('seq_trx_in')::text, 4, '0'),
               'IN', $1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING id, trx_number`,
      [
        input.trx_date,
        insp.id,
        insp.supply_order_id,
        insp.shipment_id,
        insp.supplier_id,
        input.notes,
        photos[0]?.image_url || null,
        user.id,
      ],
    );
    const trx = ins.rows[0];

    await client.query(
      `INSERT INTO inventory_transaction_items (transaction_id, product_id, quantity)
       SELECT $1, x.product_id, x.quantity FROM unnest($2::int[], $3::numeric[]) AS x(product_id, quantity)`,
      [trx.id, inspItems.map((i) => i.product_id), inspItems.map((i) => Number(i.actual_qty))],
    );

    const totalKg = inspItems.reduce((a, i) => a + Number(i.actual_qty), 0);
    await logActivity(client, {
      actor: user,
      action: 'create_in',
      entityType: 'transaction',
      entityId: trx.id,
      summary: `Staff ${user.name} mengajukan Incoming Transaction ${trx.trx_number} dari ${insp.order_number} (${totalKg} kg).`,
    });
    await notifyRole(client, 'manager', {
      title: `Barang Masuk Menunggu Persetujuan (${trx.trx_number})`,
      message: `Staff ${user.name} mengajukan penerimaan ${totalKg} kg dari ${insp.supplier_name} (${insp.order_number}).`,
      link: `/transactions/${trx.id}`,
    });
    return trx.id;
  });
}

/**
 * Staff Gudang membuat Outgoing Transaction (status awal: Pending, stok belum berubah).
 */
export async function createOutgoingTransaction(user, input) {
  if (user.role !== 'staff') {
    throw new AppError('Transaksi barang keluar (OUT) dibuat oleh Staff Gudang.');
  }
  return withTransaction(async (client) => {
    const ids = input.items.map((i) => i.product_id);
    const { rows: prods } = await client.query(
      'SELECT id, name, stock, unit FROM products WHERE id = ANY($1::int[]) AND is_active = TRUE',
      [ids],
    );
    const map = new Map(prods.map((p) => [p.id, p]));
    for (const it of input.items) {
      const p = map.get(it.product_id);
      if (!p) throw new AppError('Salah satu produk tidak ditemukan atau nonaktif.', 'items');
      if (it.quantity > Number(p.stock)) {
        throw new AppError(
          `Kuantitas "${p.name}" (${it.quantity} ${p.unit}) melebihi stok tersedia (${p.stock} ${p.unit}).`,
          'items',
        );
      }
    }

    const ins = await client.query(
      `INSERT INTO inventory_transactions (trx_number, type, trx_date, recipient_name, destination, notes, proof_image_url, status, created_by)
       VALUES ('TRX-OUT-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(nextval('seq_trx_out')::text, 4, '0'),
               'OUT', $1, $2, $3, $4, NULL, 'pending', $5)
       RETURNING id, trx_number`,
      [input.trx_date, input.recipient_name, input.destination, input.notes, user.id],
    );
    const trx = ins.rows[0];

    await client.query(
      `INSERT INTO inventory_transaction_items (transaction_id, product_id, quantity)
       SELECT $1, x.product_id, x.quantity FROM unnest($2::int[], $3::numeric[]) AS x(product_id, quantity)`,
      [trx.id, ids, input.items.map((i) => i.quantity)],
    );

    const totalKg = input.items.reduce((a, i) => a + i.quantity, 0);
    await logActivity(client, {
      actor: user,
      action: 'create_out',
      entityType: 'transaction',
      entityId: trx.id,
      summary: `Staff ${user.name} mengajukan barang keluar ${trx.trx_number} ke ${input.recipient_name} (${totalKg} kg).`,
    });
    await notifyRole(client, 'manager', {
      title: `Barang Keluar Menunggu Persetujuan (${trx.trx_number})`,
      message: `${user.name} mengajukan pengeluaran ${totalKg} kg untuk ${input.recipient_name}.`,
      link: `/transactions/${trx.id}`,
    });
    return trx.id;
  });
}

/**
 * Staff Gudang mengedit transaksi OUT miliknya sendiri selama masih berstatus Pending.
 */
export async function updateOutgoingTransaction(user, trxId, input) {
  if (user.role !== 'staff') {
    throw new AppError('Hanya Staff Gudang yang dapat mengedit pengajuan barang keluar miliknya.');
  }
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM inventory_transactions WHERE id = $1 FOR UPDATE', [trxId]);
    const trx = rows[0];
    if (!trx) throw new AppError('Transaksi tidak ditemukan.');
    if (trx.type !== 'OUT' || trx.status !== 'pending') {
      throw new AppError('Hanya transaksi Barang Keluar berstatus Pending yang dapat diubah.');
    }
    if (trx.created_by !== user.id) {
      throw new AppError('Anda hanya dapat mengubah transaksi yang Anda buat sendiri.');
    }

    const ids = input.items.map((i) => i.product_id);
    const { rows: prods } = await client.query(
      'SELECT id, name, stock, unit FROM products WHERE id = ANY($1::int[]) AND is_active = TRUE',
      [ids],
    );
    const map = new Map(prods.map((p) => [p.id, p]));
    for (const it of input.items) {
      const p = map.get(it.product_id);
      if (!p) throw new AppError('Salah satu produk tidak ditemukan atau nonaktif.', 'items');
      if (it.quantity > Number(p.stock)) {
        throw new AppError(
          `Kuantitas "${p.name}" (${it.quantity} ${p.unit}) melebihi stok tersedia (${p.stock} ${p.unit}).`,
          'items',
        );
      }
    }

    await client.query(
      `UPDATE inventory_transactions
          SET trx_date = $1, recipient_name = $2, destination = $3, notes = $4, updated_at = NOW()
        WHERE id = $5`,
      [input.trx_date, input.recipient_name, input.destination, input.notes, trxId],
    );
    await client.query('DELETE FROM inventory_transaction_items WHERE transaction_id = $1', [trxId]);
    await client.query(
      `INSERT INTO inventory_transaction_items (transaction_id, product_id, quantity)
       SELECT $1, x.product_id, x.quantity FROM unnest($2::int[], $3::numeric[]) AS x(product_id, quantity)`,
      [trxId, ids, input.items.map((i) => i.quantity)],
    );

    await logActivity(client, {
      actor: user,
      action: 'update_out',
      entityType: 'transaction',
      entityId: trxId,
      summary: `Staff ${user.name} memperbarui transaksi pending ${trx.trx_number}.`,
    });
  });
}

/**
 * Hapus transaksi yang masih berstatus Pending (Staff hanya miliknya sendiri).
 */
export async function deletePendingTransaction(user, trxId) {
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM inventory_transactions WHERE id = $1 FOR UPDATE', [trxId]);
    const trx = rows[0];
    if (!trx) throw new AppError('Transaksi tidak ditemukan.');
    if (trx.status !== 'pending') {
      throw new AppError('Hanya transaksi berstatus Pending yang dapat dihapus.');
    }
    if (user.role === 'staff' && trx.created_by !== user.id) {
      throw new AppError('Anda hanya dapat menghapus transaksi yang Anda buat sendiri.');
    }
    if (!['staff', 'manager'].includes(user.role)) {
      throw new AppError('Anda tidak memiliki izin menghapus transaksi ini.');
    }

    await client.query('DELETE FROM inventory_transaction_items WHERE transaction_id = $1', [trxId]);
    await client.query('DELETE FROM inventory_transactions WHERE id = $1', [trxId]);
    await logActivity(client, {
      actor: user,
      action: 'delete_pending_transaction',
      entityType: 'transaction',
      entityId: trxId,
      summary: `${user.name} menghapus transaksi pending ${trx.trx_number}.`,
    });
    return trx.type;
  });
}

/**
 * Persetujuan / Penolakan transaksi IN & OUT oleh Manager Gudang:
 * - IN Approved  -> Stok BERTAMBAH (+) atomik + stock_movements + PO & Shipment otomatis menjadi Received!
 * - OUT Approved -> Lampu hijau packing untuk Staff (KETENTUAN FINAL: Stok BELUM berkurang pada tahap Approved!).
 * - Rejected     -> Wajib alasan, stok TIDAK berubah.
 */
export async function decideTransaction(user, trxId, decision, rejectReason = '') {
  if (user.role !== 'manager') {
    throw new AppError('Hanya Manager Gudang yang berwenang menyetujui atau menolak transaksi.');
  }
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM inventory_transactions WHERE id = $1 FOR UPDATE', [trxId]);
    const trx = rows[0];
    if (!trx) throw new AppError('Transaksi tidak ditemukan.');
    if (trx.status !== 'pending') {
      throw new AppError('Transaksi ini sudah diproses sebelumnya dan tidak dapat diproses ulang.');
    }

    if (decision === 'reject') {
      if (!rejectReason || rejectReason.trim().length < 3) {
        throw new AppError('Alasan penolakan transaksi wajib diisi minimal 3 karakter.', 'reason');
      }
      await client.query(
        `UPDATE inventory_transactions
            SET status = 'rejected', reject_reason = $1, approved_by = $2, decided_at = NOW(), updated_at = NOW()
          WHERE id = $3`,
        [rejectReason.trim(), user.id, trxId],
      );
      await logActivity(client, {
        actor: user,
        action: trx.type === 'IN' ? 'reject_in' : 'reject_out',
        entityType: 'transaction',
        entityId: trxId,
        summary: `Manager menolak ${trx.trx_number}: ${rejectReason.trim()} (stok tidak berubah).`,
      });
      await notifyRole(client, 'staff', {
        title: `Transaksi ${trx.trx_number} Ditolak`,
        message: `Alasan: ${rejectReason.trim()}`,
        link: `/transactions/${trxId}`,
      });
      return;
    }

    const { rows: items } = await client.query(
      'SELECT product_id, quantity FROM inventory_transaction_items WHERE transaction_id = $1 ORDER BY product_id',
      [trxId],
    );
    if (items.length === 0) throw new AppError('Detail item transaksi kosong.');

    const { rows: prods } = await client.query(
      'SELECT id, name, stock, unit FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
      [items.map((i) => i.product_id)],
    );
    const prodMap = new Map(prods.map((p) => [p.id, p]));

    for (const it of items) {
      const p = prodMap.get(it.product_id);
      if (!p) throw new AppError('Produk pada transaksi tidak ditemukan.');
      if (trx.type === 'OUT' && Number(it.quantity) > Number(p.stock)) {
        throw new AppError(
          `Stok "${p.name}" tidak mencukupi (tersedia ${p.stock} ${p.unit}, diminta ${it.quantity} ${p.unit}).`,
        );
      }
    }

    // ATURAN MUTLAK 4A:
    // - Stok Bertambah (+) saat Incoming Transaction menjadi Approved oleh Manager.
    // - Stok Berkurang (-) BELUM terjadi saat Outgoing Approved — baru berkurang saat Shipped oleh Staff!
    if (trx.type === 'IN') {
      for (const it of items) {
        const p = prodMap.get(it.product_id);
        const before = Number(p.stock);
        const delta = Number(it.quantity);
        const after = Math.round((before + delta) * 100) / 100;

        await client.query('UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2', [after, it.product_id]);
        await client.query(
          `INSERT INTO stock_movements (product_id, transaction_id, movement_type, quantity_change, stock_before, stock_after, actor_id, notes)
           VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)`,
          [it.product_id, trxId, delta, before, after, user.id, `Persetujuan ${trx.trx_number} (PO Received)`],
        );
      }
    }

    await client.query(
      `UPDATE inventory_transactions
          SET status = 'approved', approved_by = $1, decided_at = NOW(), updated_at = NOW()
        WHERE id = $2`,
      [user.id, trxId],
    );

    if (trx.type === 'IN') {
      if (trx.inspection_id) {
        await client.query(
          `UPDATE inspections
              SET manager_decision = 'accepted', decision_by = $1, decision_at = NOW(),
                  decision_notes = COALESCE(decision_notes, 'Disetujui melalui konfirmasi Barang Masuk.'), updated_at = NOW()
            WHERE id = $2`,
          [user.id, trx.inspection_id],
        );
      }
      if (trx.shipment_id) {
        await client.query("UPDATE shipments SET status = 'received', updated_at = NOW() WHERE id = $1", [trx.shipment_id]);
      }
      if (trx.supply_order_id) {
        const { rows: soRows } = await client.query(
          "UPDATE supply_orders SET status = 'received', updated_at = NOW() WHERE id = $1 RETURNING supplier_id, order_number",
          [trx.supply_order_id],
        );
        if (soRows[0]) {
          await notifySupplier(client, soRows[0].supplier_id, {
            title: `PO ${soRows[0].order_number} Diterima (Received)`,
            message: `Barang masuk ${trx.trx_number} telah disetujui Manager dan stok resmi masuk gudang.`,
            link: `/supply-orders/${trx.supply_order_id}`,
          });
        }
      }

      await logActivity(client, {
        actor: user,
        action: 'approve_in',
        entityType: 'transaction',
        entityId: trxId,
        summary: `Manager menyetujui ${trx.trx_number} — stok bertambah otomatis dan PO menjadi Received.`,
      });
    } else {
      await logActivity(client, {
        actor: user,
        action: 'approve_out',
        entityType: 'transaction',
        entityId: trxId,
        summary: `Manager menyetujui ${trx.trx_number} (siap packing & dikirim Staff; stok berkurang saat Shipped).`,
      });
      await notifyRole(client, 'staff', {
        title: `Barang Keluar Disetujui (${trx.trx_number})`,
        message: `Silakan packing barang untuk ${trx.recipient_name}, unggah foto bukti kirim, dan klik Kirim Barang (Shipped).`,
        link: `/transactions/${trxId}`,
      });
    }
  });
}

/**
 * Staff Gudang menyelesaikan packing & pengiriman Outgoing Transaction: Approved -> Shipped.
 * ATURAN MUTLAK 4A: Stok BERKURANG (-) secara atomik TEPAT saat status berubah menjadi Shipped!
 */
export async function shipOutgoingTransaction(user, trxId, proofUrl) {
  if (user.role !== 'staff') {
    throw new AppError('Pembaruan status Shipped dilakukan oleh Staff Gudang.');
  }
  if (!proofUrl) {
    throw new AppError('Foto bukti pengiriman wajib diunggah untuk mengubah status ke Shipped.', 'proof_image');
  }
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM inventory_transactions WHERE id = $1 FOR UPDATE', [trxId]);
    const trx = rows[0];
    if (!trx) throw new AppError('Transaksi tidak ditemukan.');
    if (trx.type !== 'OUT') throw new AppError('Status Shipped hanya berlaku untuk transaksi Barang Keluar (OUT).');
    if (trx.status !== 'approved') throw new AppError('Transaksi harus berstatus Approved sebelum dikirim (Shipped).');

    const { rows: items } = await client.query(
      'SELECT product_id, quantity FROM inventory_transaction_items WHERE transaction_id = $1 ORDER BY product_id',
      [trxId],
    );
    if (items.length === 0) throw new AppError('Detail item transaksi kosong.');

    const { rows: prods } = await client.query(
      'SELECT id, name, stock, unit FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
      [items.map((i) => i.product_id)],
    );
    const prodMap = new Map(prods.map((p) => [p.id, p]));

    for (const it of items) {
      const p = prodMap.get(it.product_id);
      if (!p) throw new AppError('Produk pada transaksi tidak ditemukan.');
      if (Number(it.quantity) > Number(p.stock)) {
        throw new AppError(
          `Stok "${p.name}" saat ini tidak mencukupi untuk dikirim (tersedia ${p.stock} ${p.unit}, diminta ${it.quantity} ${p.unit}).`,
        );
      }
    }

    for (const it of items) {
      const p = prodMap.get(it.product_id);
      const before = Number(p.stock);
      const delta = -Number(it.quantity);
      const after = Math.round((before + delta) * 100) / 100;
      if (after < 0) throw new AppError('Stok produk tidak boleh bernilai negatif.');

      await client.query('UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2', [after, it.product_id]);
      await client.query(
        `INSERT INTO stock_movements (product_id, transaction_id, movement_type, quantity_change, stock_before, stock_after, actor_id, notes)
         VALUES ($1, $2, 'OUT', $3, $4, $5, $6, $7)`,
        [it.product_id, trxId, delta, before, after, user.id, `Pengiriman ${trx.trx_number} (Shipped)`],
      );
    }

    await client.query(
      `UPDATE inventory_transactions
          SET status = 'shipped',
              shipped_at = NOW(),
              shipped_by = $1,
              proof_image_url = $2,
              updated_at = NOW()
        WHERE id = $3`,
      [user.id, proofUrl, trxId],
    );

    await logActivity(client, {
      actor: user,
      action: 'ship_out',
      entityType: 'transaction',
      entityId: trxId,
      summary: `Staff ${user.name} mengirim ${trx.trx_number} ke ${trx.recipient_name} (Shipped) — stok berkurang otomatis.`,
    });
  });
}
