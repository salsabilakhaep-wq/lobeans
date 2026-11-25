import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { fmtDateTime, num } from '@/lib/format.js';
import {
  Card, DataTable, FilterPills, Flash, MetricCard, PageHeader, StatusBadge, hideCls, td,
} from '@/components/ui.js';

export const metadata = { title: 'Pengiriman Barang' };

export default async function ShipmentsPage({ searchParams }) {
  const user = await requireUser(['supplier', 'manager', 'admin']);
  const sp = await searchParams;
  const statusFilter = sp.status || '';

  const isSupplier = user.role === 'supplier';
  const params = isSupplier ? [user.supplier_id] : [];
  const whereClause = isSupplier ? 'WHERE so.supplier_id = $1' : '';

  const all = await many(
    `SELECT sh.*,
            so.order_number,
            so.expected_date,
            s.company_name AS supplier_name,
            COALESCE((SELECT SUM(quantity) FROM supply_order_items WHERE supply_order_id = so.id), 0)::numeric AS total_qty,
            rt.reason AS return_reason,
            rt.instructions AS return_instructions
       FROM shipments sh
       JOIN supply_orders so ON so.id = sh.supply_order_id
       JOIN suppliers s ON s.id = so.supplier_id
       LEFT JOIN returns rt ON rt.shipment_id = sh.id
       ${whereClause}
      ORDER BY CASE sh.status
                 WHEN 'returned' THEN 0
                 WHEN 'in_transit' THEN 1
                 WHEN 'arrived' THEN 2
                 WHEN 'inspecting' THEN 3
                 ELSE 4
               END,
               sh.updated_at DESC, sh.id DESC`,
    params,
  );

  const list = statusFilter ? all.filter((sh) => sh.status === statusFilter) : all;

  const inTransitCount = all.filter((sh) => sh.status === 'in_transit').length;
  const arrivedInspectCount = all.filter((sh) => ['arrived', 'inspecting'].includes(sh.status)).length;
  const receivedCount = all.filter((sh) => sh.status === 'received').length;
  const returnShipments = all.filter((sh) => sh.status === 'returned');

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow={isSupplier ? 'Portal Supplier' : 'Logistik Pasokan'}
        title="Pengiriman Barang"
        subtitle={
          isSupplier
            ? 'Pantau seluruh pengiriman Anda berdasarkan status, unggah bukti kirim & kedatangan, serta tindak lanjuti klaim refund jika terjadi retur.'
            : 'Pantau seluruh pengiriman dan status penerimaan dari mitra supplier.'
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Dalam Perjalanan" value={num(inTransitCount)} note="Status In Transit" href="/shipments?status=in_transit" />
        <MetricCard label="Tiba & Diperiksa" value={num(arrivedInspectCount)} note="Arrived / Inspecting" href="/shipments?status=inspecting" />
        <MetricCard label="Diterima (Received)" value={num(receivedCount)} note="Stok sudah masuk gudang" href="/shipments?status=received" />
        <MetricCard label="Diretur / Klaim Refund" value={num(returnShipments.length)} note="Status Returned" href="/shipments?status=returned" />
      </div>

      {returnShipments.length > 0 && (
        <div className="mb-6">
          <Card
            title={`Pemberitahuan Retur & Klaim Refund (${returnShipments.length})`}
            subtitle="Pengiriman berikut ditolak oleh Manager Gudang karena tidak sesuai / rusak (stok tidak bertambah). Tindak lanjuti klaim refund sesuai catatan."
            className="border-red-300/80"
          >
            <DataTable
              head={[
                { label: 'No. Pengiriman & PO' },
                { label: 'Alasan Retur & Klaim Refund' },
                { label: 'Status' },
                { label: 'Detail', align: 'right' },
              ]}
            >
              {returnShipments.map((sh) => (
                <tr key={sh.id} className="bg-red-50/25 hover:bg-red-50/50">
                  <td className={td}>
                    <p className="font-mono font-bold text-lobeans-ink">{sh.shipment_number}</p>
                    <p className="text-[11px] text-lobeans-muted">{sh.order_number}</p>
                  </td>
                  <td className={td}>
                    <p className="font-semibold text-red-900">{sh.return_reason || 'Ketidaksesuaian hasil pemeriksaan'}</p>
                    {sh.return_instructions && (
                      <p className="mt-0.5 text-[11px] text-lobeans-muted">Catatan refund: {sh.return_instructions}</p>
                    )}
                  </td>
                  <td className={td}>
                    <StatusBadge status="returned" />
                  </td>
                  <td className={`${td} text-right`}>
                    <Link
                      href={`/supply-orders/${sh.supply_order_id}?from=shipments`}
                      className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-red-700 transition-colors hover:bg-red-600 hover:text-white"
                    >
                      Lihat Detail →
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>
      )}

      <FilterPills
        basePath="/shipments"
        active={statusFilter}
        items={[
          ['', 'Semua', all.length],
          ['in_transit', 'In Transit', inTransitCount],
          ['arrived', 'Arrived', all.filter((s) => s.status === 'arrived').length],
          ['inspecting', 'Inspecting', all.filter((s) => s.status === 'inspecting').length],
          ['received', 'Received', receivedCount],
          ['returned', 'Returned', returnShipments.length],
        ]}
      />

      <Card
        title={`Daftar Pengiriman (${list.length})`}
        subtitle="Klik salah satu pengiriman untuk memperbarui status, mengunggah foto dokumentasi, atau memantau pemeriksaan."
      >
        <DataTable
          head={[
            { label: 'No. Pengiriman & PO' },
            { label: 'Berat', align: 'right', hide: 'sm' },
            { label: 'Bukti Foto', hide: 'md' },
            { label: 'Update Terakhir', hide: 'lg' },
            { label: 'Status' },
            { label: 'Aksi', align: 'right' },
          ]}
          empty={list.length === 0}
          emptyText="Belum ada data pengiriman pada filter status ini."
        >
          {list.map((sh) => (
            <tr key={sh.id} className="hover:bg-[#faf9f5]">
              <td className={td}>
                <Link
                  href={`/supply-orders/${sh.supply_order_id}?from=shipments`}
                  className="font-mono text-[13px] font-bold text-lobeans-forest hover:underline"
                >
                  {sh.shipment_number}
                </Link>
                <p className="mt-0.5 text-[11.5px] font-semibold text-lobeans-ink">{sh.order_number}</p>
              </td>
              <td className={`${td} text-right font-bold tabular-nums ${hideCls('sm')}`}>{num(sh.total_qty)} kg</td>
              <td className={`${td} ${hideCls('md')}`}>
                <div className="flex items-center gap-2">
                  {sh.shipping_proof_url && (
                    <a href={sh.shipping_proof_url} target="_blank" rel="noreferrer" title="Bukti Kirim">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sh.shipping_proof_url} alt="Bukti kirim" className="h-9 w-9 rounded-md border border-[#e5e4dc] object-cover" />
                    </a>
                  )}
                  {sh.arrival_proof_url && (
                    <a href={sh.arrival_proof_url} target="_blank" rel="noreferrer" title="Bukti Kedatangan">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sh.arrival_proof_url} alt="Bukti kedatangan" className="h-9 w-9 rounded-md border border-[#e5e4dc] object-cover" />
                    </a>
                  )}
                  {!sh.shipping_proof_url && !sh.arrival_proof_url && (
                    <span className="text-[11px] text-lobeans-muted">Belum ada</span>
                  )}
                </div>
              </td>
              <td className={`${td} text-[11.5px] text-lobeans-muted ${hideCls('lg')}`}>{fmtDateTime(sh.updated_at)}</td>
              <td className={td}>
                <StatusBadge status={sh.status} />
              </td>
              <td className={`${td} text-right`}>
                <Link
                  href={`/supply-orders/${sh.supply_order_id}?from=shipments`}
                  className="inline-flex items-center rounded-lg border border-lobeans-border bg-white px-3 py-1.5 text-[11.5px] font-bold text-lobeans-forest transition-colors hover:bg-lobeans-forest hover:text-white"
                >
                  Kelola →
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}
