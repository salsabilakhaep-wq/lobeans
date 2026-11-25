import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { fmtDateTime, num } from '@/lib/format.js';
import { Card, DataTable, Flash, PageHeader, StatusBadge, hideCls, td } from '@/components/ui.js';

export const metadata = { title: 'Pemeriksaan Barang' };

export default async function InspectionsPage({ searchParams }) {
  const user = await requireUser(['staff', 'manager', 'admin']);
  const sp = await searchParams;

  const [pendingList, historyList, returnList] = await Promise.all([
    many(
      `SELECT sh.id AS shipment_id, sh.shipment_number, sh.attempt_number, sh.shipment_type, sh.arrived_at,
              so.id AS supply_order_id, so.order_number, s.company_name AS supplier_name,
              i.id AS inspection_id, i.instructed_at,
              COALESCE((SELECT SUM(quantity) FROM supply_order_items WHERE supply_order_id = so.id),0)::numeric AS total_qty
         FROM shipments sh
         JOIN inspections i ON i.shipment_id = sh.id
         JOIN supply_orders so ON so.id = sh.supply_order_id
         JOIN suppliers s ON s.id = so.supplier_id
        WHERE sh.status = 'inspecting' AND i.status = 'pending'
        ORDER BY i.instructed_at ASC`,
    ),
    many(
      `SELECT sh.id AS shipment_id, sh.shipment_number, sh.attempt_number, sh.status AS shipment_status,
              so.id AS supply_order_id, so.order_number, s.company_name AS supplier_name,
              i.id AS inspection_id, i.overall_result, i.submitted_at, i.manager_decision,
              u.name AS inspector_name,
              (SELECT COUNT(*) FROM inspection_photos WHERE inspection_id = i.id)::int AS photo_count,
              (SELECT id FROM inventory_transactions t WHERE t.inspection_id = i.id AND t.status <> 'rejected' LIMIT 1) AS active_in_trx_id
         FROM inspections i
         JOIN shipments sh ON sh.id = i.shipment_id
         JOIN supply_orders so ON so.id = sh.supply_order_id
         JOIN suppliers s ON s.id = so.supplier_id
         LEFT JOIN users u ON u.id = i.inspector_id
        WHERE i.status = 'submitted'
        ORDER BY i.submitted_at DESC LIMIT 20`,
    ),
    many(
      `SELECT rt.*, sh.shipment_number, so.order_number, s.company_name AS supplier_name
         FROM returns rt
         JOIN shipments sh ON sh.id = rt.shipment_id
         JOIN supply_orders so ON so.id = rt.supply_order_id
         JOIN suppliers s ON s.id = so.supplier_id
        WHERE rt.status <> 'returned'
        ORDER BY rt.created_at DESC`,
    ),
  ]);

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow="Operasional Penerimaan"
        title="Pemeriksaan Barang Tiba"
        subtitle="Periksa kuantitas aktual dan mutu barang tiba disertai foto bukti wajib. Setelah hasil Sesuai, lanjutkan dengan mencatat Barang Masuk (IN) untuk Manager."
      />

      <div className="space-y-6">
        <Card
          title={`Antrean Pemeriksaan (${pendingList.length})`}
          subtitle="Pengiriman yang diinstruksikan Manager Gudang untuk diperiksa secara fisik."
        >
          <DataTable
            head={[
              { label: 'Pengiriman & Pesanan' },
              { label: 'Supplier' },
              { label: 'Diinstruksikan', hide: 'md' },
              { label: 'Berat Diminta', align: 'right' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={pendingList.length === 0}
            emptyText="Tidak ada antrean pemeriksaan saat ini."
          >
            {pendingList.map((r) => (
              <tr key={r.shipment_id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{r.shipment_number}</p>
                  <p className="text-[11px] text-lobeans-muted">
                    {r.order_number} · Percobaan #{r.attempt_number} ({r.shipment_type === 'reshipment' ? 'Reshipment' : 'Awal'})
                  </p>
                </td>
                <td className={`${td} font-semibold text-lobeans-ink`}>{r.supplier_name}</td>
                <td className={`${td} ${hideCls('md')} text-[11.5px] text-lobeans-muted`}>{fmtDateTime(r.instructed_at)}</td>
                <td className={`${td} text-right font-bold tabular-nums`}>{num(r.total_qty)} kg</td>
                <td className={`${td} text-right`}>
                  {user.role === 'staff' ? (
                    <Link href={`/inspections/${r.shipment_id}`} className="font-bold text-[#284c35] hover:underline">
                      Isi Pemeriksaan →
                    </Link>
                  ) : (
                    <Link href={`/supply-orders/${r.supply_order_id}?from=inspections`} className="font-bold text-[#284c35] hover:underline">
                      Detail Pesanan →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        {returnList.length > 0 && (
          <Card title={`Barang Retur Menunggu Pengembalian Fisik (${returnList.length})`} subtitle="Kembalikan barang yang ditolak ke Supplier lalu konfirmasi Returned.">
            <DataTable
              head={[
                { label: 'Pengiriman & Pesanan' },
                { label: 'Supplier' },
                { label: 'Alasan Retur', hide: 'md' },
                { label: 'Aksi', align: 'right' },
              ]}
            >
              {returnList.map((rt) => (
                <tr key={rt.id} className="hover:bg-[#faf9f5]">
                  <td className={td}>
                    <p className="font-mono font-bold text-lobeans-ink">{rt.shipment_number}</p>
                    <p className="text-[11px] text-lobeans-muted">{rt.order_number}</p>
                  </td>
                  <td className={`${td} font-semibold text-lobeans-ink`}>{rt.supplier_name}</td>
                  <td className={`${td} ${hideCls('md')} text-red-800`}>{rt.reason}</td>
                  <td className={`${td} text-right`}>
                    <Link href={`/supply-orders/${rt.supply_order_id}?from=inspections`} className="font-bold text-[#284c35] hover:underline">
                      Konfirmasi Retur →
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        )}

        <Card title="Riwayat Laporan Pemeriksaan" subtitle="Laporan pemeriksaan fisik yang sudah selesai dilakukan.">
          <DataTable
            head={[
              { label: 'Pengiriman & Pesanan' },
              { label: 'Pemeriksa', hide: 'md' },
              { label: 'Hasil' },
              { label: 'Foto', align: 'right', hide: 'sm' },
              { label: 'Status' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={historyList.length === 0}
          >
            {historyList.map((h) => {
              const needsInSubmission =
                user.role === 'staff' &&
                h.overall_result === 'sesuai' &&
                !h.active_in_trx_id &&
                h.manager_decision !== 'refund';

              return (
                <tr key={h.inspection_id} className="hover:bg-[#faf9f5]">
                  <td className={td}>
                    <p className="font-mono font-bold text-lobeans-ink">{h.shipment_number}</p>
                    <p className="text-[11px] text-lobeans-muted">
                      {h.order_number} · {h.supplier_name}
                    </p>
                  </td>
                  <td className={`${td} ${hideCls('md')} text-lobeans-muted`}>
                    <p className="font-semibold text-lobeans-ink">{h.inspector_name || '—'}</p>
                    <p className="text-[10.5px]">{fmtDateTime(h.submitted_at)}</p>
                  </td>
                  <td className={td}>
                    <StatusBadge status={h.overall_result} />
                  </td>
                  <td className={`${td} ${hideCls('sm')} text-right font-bold tabular-nums`}>{h.photo_count} foto</td>
                  <td className={td}>
                    <StatusBadge status={h.shipment_status} />
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="inline-flex items-center gap-3">
                      {needsInSubmission && (
                        <Link
                          href={`/transactions/new?type=IN&inspection_id=${h.inspection_id}`}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          Catat Barang Masuk →
                        </Link>
                      )}
                      <Link href={`/supply-orders/${h.supply_order_id}?from=inspections`} className="font-bold text-[#284c35] hover:underline">
                        Lihat →
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
      </div>
    </>
  );
}
