import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { many, one } from '@/lib/db.js';
import { fmtDate, fmtDateTime, num } from '@/lib/format.js';
import { SupplyOrderWorkflow } from '@/components/SupplyOrderWorkflow.js';
import { ShipmentProofCards } from '@/components/ShipmentProofCards.js';
import { Card, DataTable, Flash, LinkButton, PageHeader, StatusBadge, hideCls, td } from '@/components/ui.js';

export const metadata = { title: 'Detail Permintaan Pasokan' };

export default async function SupplyOrderDetailPage({ params, searchParams }) {
  const user = await requireUser(['admin', 'manager', 'staff', 'supplier']);
  const { id } = await params;
  const sp = await searchParams;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  const order = await one(
    `SELECT so.*,
            s.company_name AS supplier_name,
            s.supplier_code,
            s.contact_name,
            s.phone AS supplier_phone,
            u.name AS creator_name,
            d.name AS decider_name
       FROM supply_orders so
       JOIN suppliers s ON s.id = so.supplier_id
       JOIN users u ON u.id = so.created_by
       LEFT JOIN users d ON d.id = so.decision_by
      WHERE so.id = $1`,
    [orderId],
  );

  if (!order) notFound();
  if (user.role === 'supplier' && order.supplier_id !== user.supplier_id) {
    notFound();
  }

  const [items, shipments, inspections, returns, inTrxs] = await Promise.all([
    many(
      `SELECT soi.*, p.sku, p.name AS product_name, p.unit, p.image_url, c.name AS category_name
         FROM supply_order_items soi
         JOIN products p ON p.id = soi.product_id
         JOIN categories c ON c.id = p.category_id
        WHERE soi.supply_order_id = $1
        ORDER BY soi.id`,
      [orderId],
    ),
    many(
      `SELECT sh.*
         FROM shipments sh
        WHERE sh.supply_order_id = $1
        ORDER BY sh.attempt_number DESC`,
      [orderId],
    ),
    many(
      `SELECT i.*, sh.shipment_number, sh.attempt_number,
              ins.name AS inspector_name,
              mgr.name AS decider_name
         FROM inspections i
         JOIN shipments sh ON sh.id = i.shipment_id
         LEFT JOIN users ins ON ins.id = i.inspector_id
         LEFT JOIN users mgr ON mgr.id = i.decision_by
        WHERE sh.supply_order_id = $1
        ORDER BY i.id DESC`,
      [orderId],
    ),
    many(
      `SELECT rt.*, sh.shipment_number, sh.attempt_number, u.name AS confirmed_by_name
         FROM returns rt
         JOIN shipments sh ON sh.id = rt.shipment_id
         LEFT JOIN users u ON u.id = rt.confirmed_by
        WHERE sh.supply_order_id = $1
        ORDER BY rt.id DESC`,
      [orderId],
    ),
    many(
      `SELECT t.*, u.name AS approver_name
         FROM inventory_transactions t
         LEFT JOIN users u ON u.id = t.approved_by
        WHERE t.supply_order_id = $1
        ORDER BY t.id DESC`,
      [orderId],
    ),
  ]);

  const inspectionIds = inspections.map((i) => i.id);
  const [inspectionItems, inspectionPhotos] = inspectionIds.length
    ? await Promise.all([
        many(
          `SELECT ii.*, p.sku, p.name AS product_name, p.unit
             FROM inspection_items ii
             JOIN products p ON p.id = ii.product_id
            WHERE ii.inspection_id = ANY($1::int[])
            ORDER BY ii.id`,
          [inspectionIds],
        ),
        many(
          `SELECT ip.*
             FROM inspection_photos ip
            WHERE ip.inspection_id = ANY($1::int[])
            ORDER BY ip.id`,
          [inspectionIds],
        ),
      ])
    : [[], []];

  const latestShipment = shipments[0] || null;
  const latestInspection = latestShipment ? inspections.find((i) => i.shipment_id === latestShipment.id) || null : null;
  const latestReturn = latestShipment ? returns.find((r) => r.shipment_id === latestShipment.id) || null : null;
  const latestInTrx = inTrxs.find((t) => t.status !== 'rejected') || inTrxs[0] || null;

  const totalQty = items.reduce((a, it) => a + Number(it.quantity), 0);

  const shipmentsForCards = shipments.map((sh) => ({
    id: sh.id,
    shipment_number: sh.shipment_number,
    status: sh.status,
    shipping_proof_url: sh.shipping_proof_url,
    arrival_proof_url: sh.arrival_proof_url,
    shipped_at_fmt: sh.shipped_at ? fmtDateTime(sh.shipped_at) : null,
    arrived_at_fmt: sh.arrived_at ? fmtDateTime(sh.arrived_at) : null,
  }));

  // Tombol kembali kontekstual: Staff selalu kembali ke "Pemeriksaan Barang" (/inspections)
  let backHref = '/supply-orders';
  let backLabel = '← Daftar Pasokan';
  if (user.role === 'staff' || sp.from === 'inspections') {
    backHref = '/inspections';
    backLabel = '← Pemeriksaan Barang';
  } else if (sp.from === 'shipments') {
    backHref = '/shipments';
    backLabel = '← Pengiriman Barang';
  }

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow={`Permintaan Pasokan · ${order.supplier_code}`}
        title={order.order_number}
        subtitle={`${order.supplier_name} · Dibuat ${fmtDate(order.order_date)} · Estimasi tiba ${fmtDate(order.expected_date)}`}
        action={
          <LinkButton href={backHref} variant="secondary">
            {backLabel}
          </LinkButton>
        }
      />

      <div className="space-y-6">
        {/* 1. Card Status */}
        <Card
          title="Status"
          subtitle="Pantau tahapan pesanan dan lakukan tindakan selanjutnya sesuai status terkini."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-lobeans-muted">Pesanan:</span>
                <StatusBadge status={order.status} />
              </div>
              {latestShipment && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-lobeans-muted">Pengiriman:</span>
                  <StatusBadge status={latestShipment.status} />
                </div>
              )}
            </div>
          }
          padded
        >
          <SupplyOrderWorkflow
            order={order}
            latestShipment={latestShipment}
            latestInspection={latestInspection}
            latestReturn={latestReturn}
            latestInTrx={latestInTrx}
            role={user.role}
          />
        </Card>

        {/* 2. Ringkasan Informasi & Daftar Item dengan Foto Produk */}
        <Card title={`Daftar Item Pasokan (${items.length} Produk · ${num(totalQty)} kg)`}>
          <div className="grid grid-cols-1 gap-4 border-b border-[#eeede6] bg-[#faf9f5] px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">Supplier Tujuan</p>
              <p className="mt-0.5 text-[13px] font-bold text-lobeans-ink">{order.supplier_name}</p>
              <p className="text-[11px] text-lobeans-muted">{order.contact_name} · {order.supplier_phone}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">Jadwal Pasokan</p>
              <p className="mt-0.5 text-[13px] font-bold text-lobeans-ink">{fmtDate(order.order_date)}</p>
              <p className="text-[11px] text-lobeans-muted">Estimasi tiba: {fmtDate(order.expected_date)}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">Diminta Oleh (Manager)</p>
              <p className="mt-0.5 text-[13px] font-bold text-lobeans-ink">{order.creator_name}</p>
              <p className="text-[11px] text-lobeans-muted">{fmtDateTime(order.created_at)}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">Konfirmasi Supplier</p>
              <p className="mt-0.5 text-[13px] font-bold text-lobeans-ink">{order.decider_name || 'Menunggu konfirmasi'}</p>
              <p className="text-[11px] text-lobeans-muted">{order.decision_at ? fmtDateTime(order.decision_at) : '-'}</p>
            </div>
          </div>

          {order.notes && (
            <div className="border-b border-[#eeede6] px-5 py-3.5 text-[12.5px] text-lobeans-ink sm:px-6">
              <span className="font-bold text-lobeans-forest">Catatan Permintaan:</span> {order.notes}
            </div>
          )}

          <DataTable
            head={[
              { label: 'Produk & SKU' },
              { label: 'Kategori', hide: 'sm' },
              { label: 'Jumlah Diminta', align: 'right' },
            ]}
            empty={items.length === 0}
          >
            {items.map((it) => (
              <tr key={it.id}>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.image_url || '/product-placeholder.svg'}
                      alt={it.product_name}
                      className="h-11 w-11 shrink-0 rounded-[9px] border border-[#e5e4dc] object-cover"
                    />
                    <div>
                      <p className="font-bold text-lobeans-ink">{it.product_name}</p>
                      <p className="font-mono text-[11px] text-lobeans-muted">{it.sku}</p>
                    </div>
                  </div>
                </td>
                <td className={`${td} ${hideCls('sm')}`}>
                  <span className="font-semibold text-lobeans-muted">{it.category_name}</span>
                </td>
                <td className={`${td} text-right`}>
                  <span className="text-[13.5px] font-bold text-lobeans-ink">{num(it.quantity)} {it.unit}</span>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        {/* 3. Riwayat Pengiriman + Card Foto Bukti Kirim & Bukti Tiba Langsung */}
        <Card
          title={`Riwayat Pengiriman (${shipments.length} Percobaan)`}
          subtitle="Riwayat pengiriman awal maupun pengiriman pengganti beserta kartu foto bukti kirim dan kedatangan."
        >
          <DataTable
            head={[
              { label: 'No. Pengiriman & Tipe' },
              { label: 'Waktu Update', hide: 'md' },
              { label: 'Status', align: 'right' },
            ]}
            empty={shipments.length === 0}
            emptyText="Belum ada pengiriman yang diproses untuk pesanan ini."
          >
            {shipments.map((sh) => (
              <tr key={sh.id}>
                <td className={td}>
                  <p className="font-mono text-[13px] font-bold text-lobeans-ink">
                    {sh.shipment_number}{' '}
                    <span className="rounded bg-[#f1efe8] px-1.5 py-0.5 text-[10px] font-bold text-lobeans-forest">
                      Percobaan #{sh.attempt_number} · {sh.shipment_type === 'reshipment' ? 'Reshipment' : 'Awal'}
                    </span>
                  </p>
                  {sh.notes && <p className="mt-0.5 text-[11.5px] text-lobeans-muted">{sh.notes}</p>}
                </td>
                <td className={`${td} text-[11.5px] text-lobeans-muted ${hideCls('md')}`}>
                  <p>Dibuat: {fmtDateTime(sh.created_at)}</p>
                  {sh.shipped_at && <p>Dikirim: {fmtDateTime(sh.shipped_at)}</p>}
                  {sh.arrived_at && <p className="font-semibold text-lobeans-ink">Tiba: {fmtDateTime(sh.arrived_at)}</p>}
                </td>
                <td className={`${td} text-right`}>
                  <StatusBadge status={sh.status} />
                </td>
              </tr>
            ))}
          </DataTable>

          <ShipmentProofCards shipments={shipmentsForCards} />
        </Card>

        {/* 4. Laporan Pemeriksaan Fisik & Foto Bukti */}
        {inspections.length > 0 && (
          <div className="space-y-4">
            {inspections.map((ins) => {
              const iItems = inspectionItems.filter((x) => x.inspection_id === ins.id);
              const iPhotos = inspectionPhotos.filter((x) => x.inspection_id === ins.id);
              return (
                <Card
                  key={ins.id}
                  title={`Pemeriksaan Fisik · ${ins.shipment_number} (Percobaan #${ins.attempt_number})`}
                  subtitle={
                    ins.inspector_name
                      ? `Diperiksa oleh ${ins.inspector_name} pada ${fmtDateTime(ins.submitted_at)}`
                      : `Diinstruksikan pada ${fmtDateTime(ins.instructed_at || ins.created_at)} · Menunggu Staff Gudang`
                  }
                  action={
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ins.status} />
                      {ins.overall_result && <StatusBadge status={ins.overall_result} />}
                    </div>
                  }
                >
                  {ins.notes && (
                    <div className="border-b border-[#eeede6] bg-[#faf9f5] px-5 py-3 text-[12.5px] text-lobeans-ink sm:px-6">
                      <span className="font-bold text-lobeans-forest">Catatan Pemeriksaan:</span> {ins.notes}
                    </div>
                  )}

                  {iItems.length > 0 && (
                    <DataTable
                      head={[
                        { label: 'Produk' },
                        { label: 'Dipesan', align: 'right' },
                        { label: 'Aktual', align: 'right' },
                        { label: 'Hasil', align: 'right' },
                      ]}
                    >
                      {iItems.map((ii) => (
                        <tr key={ii.id}>
                          <td className={td}>
                            <p className="font-bold text-lobeans-ink">{ii.product_name}</p>
                            <p className="font-mono text-[10.5px] text-lobeans-muted">{ii.sku}</p>
                          </td>
                          <td className={`${td} text-right font-semibold text-lobeans-muted`}>
                            {num(ii.ordered_qty)} {ii.unit}
                          </td>
                          <td className={`${td} text-right font-bold text-lobeans-ink`}>
                            {num(ii.actual_qty)} {ii.unit}
                          </td>
                          <td className={`${td} text-right`}>
                            <StatusBadge status={ii.result} />
                          </td>
                        </tr>
                      ))}
                    </DataTable>
                  )}

                  {iPhotos.length > 0 && (
                    <div className="border-t border-[#eeede6] px-5 py-4 sm:px-6">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">
                        Foto Bukti Pemeriksaan ({iPhotos.length})
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {iPhotos.map((ph) => (
                          <a
                            key={ph.id}
                            href={ph.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="group overflow-hidden rounded-[12px] border border-[#e6e5de] bg-[#faf9f5] transition-colors hover:border-lobeans-forest"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ph.image_url}
                              alt={ph.caption || 'Foto bukti pemeriksaan'}
                              className="h-44 w-full object-cover transition-transform group-hover:scale-[1.02]"
                            />
                            <div className="px-3 py-2 text-[11px]">
                              <p className="font-semibold text-lobeans-ink">{ph.caption || 'Foto Bukti Inspeksi'}</p>
                              <p className="text-lobeans-muted">{fmtDateTime(ph.created_at)}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {ins.decision_notes && (
                    <div className="border-t border-[#eeede6] px-5 py-3 text-[12px] text-lobeans-ink sm:px-6">
                      <span className="font-bold">Keputusan Manager ({ins.decider_name || 'Manager'}):</span> {ins.decision_notes}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* 5. Riwayat Retur Fisik */}
        {returns.length > 0 && (
          <Card title={`Riwayat Retur & Pengembalian Fisik (${returns.length})`}>
            <DataTable
              head={[
                { label: 'Pengiriman & Alasan' },
                { label: 'Dikonfirmasi Oleh', hide: 'md' },
                { label: 'Status', align: 'right' },
              ]}
            >
              {returns.map((rt) => (
                <tr key={rt.id}>
                  <td className={td}>
                    <p className="font-mono text-[12.5px] font-bold text-lobeans-ink">{rt.shipment_number}</p>
                    <p className="text-[12px] text-red-800">{rt.reason}</p>
                    {rt.instructions && (
                      <p className="mt-0.5 text-[11px] text-lobeans-muted">Instruksi: {rt.instructions}</p>
                    )}
                  </td>
                  <td className={`${td} text-[11.5px] text-lobeans-muted ${hideCls('md')}`}>
                    {rt.confirmed_by_name ? `${rt.confirmed_by_name} · ${fmtDateTime(rt.returned_at)}` : 'Menunggu konfirmasi fisik'}
                  </td>
                  <td className={`${td} text-right`}>
                    <StatusBadge status={rt.status} />
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        )}

        {/* 6. Transaksi Barang Masuk (IN) Terkait */}
        {inTrxs.length > 0 && user.role !== 'supplier' && (
          <Card title={`Transaksi Barang Masuk (IN) Terkait (${inTrxs.length})`}>
            <DataTable
              head={[
                { label: 'No. Transaksi' },
                { label: 'Disetujui Oleh', hide: 'sm' },
                { label: 'Status' },
                { label: 'Aksi', align: 'right' },
              ]}
            >
              {inTrxs.map((t) => (
                <tr key={t.id}>
                  <td className={td}>
                    <Link href={`/transactions/${t.id}`} className="font-mono text-[13px] font-bold text-lobeans-forest hover:underline">
                      {t.trx_number}
                    </Link>
                    <p className="text-[11px] text-lobeans-muted">{fmtDate(t.trx_date)}</p>
                  </td>
                  <td className={`${td} text-[12px] text-lobeans-muted ${hideCls('sm')}`}>
                    {t.approver_name ? `${t.approver_name} · ${fmtDateTime(t.decided_at)}` : 'Menunggu konfirmasi Manager'}
                  </td>
                  <td className={td}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={`${td} text-right`}>
                    <Link href={`/transactions/${t.id}`} className="text-[12px] font-bold text-lobeans-forest hover:underline">
                      Buka Transaksi →
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        )}
      </div>
    </>
  );
}
