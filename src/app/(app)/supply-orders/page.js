import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { fmtDate, num } from '@/lib/format.js';
import { deleteSupplyOrderAction } from '@/app/actions/supply.js';
import { ActionButton } from '@/components/ActionForm.js';
import {
  Card, DataTable, FilterPills, Flash, LinkButton, PageHeader, StatusBadge, hideCls, td,
} from '@/components/ui.js';

export const metadata = { title: 'Permintaan Pasokan (PO)' };

export default async function SupplyOrdersPage({ searchParams }) {
  const user = await requireUser(['admin', 'manager', 'staff', 'supplier']);
  const sp = await searchParams;
  const statusFilter = sp.status || '';

  const isSupplier = user.role === 'supplier';
  const isManager = user.role === 'manager';
  const params = isSupplier ? [user.supplier_id] : [];
  const whereClause = isSupplier ? 'WHERE so.supplier_id = $1' : '';

  const all = await many(
    `SELECT so.*,
            s.company_name AS supplier_name,
            s.supplier_code,
            COALESCE((SELECT SUM(quantity) FROM supply_order_items WHERE supply_order_id = so.id), 0)::numeric AS total_qty,
            (SELECT COUNT(*)::int FROM supply_order_items WHERE supply_order_id = so.id) AS item_count,
            ls.shipment_number AS latest_shipment_number,
            ls.status AS latest_shipment_status,
            li.status AS latest_inspection_status,
            li.overall_result AS latest_inspection_result
       FROM supply_orders so
       JOIN suppliers s ON s.id = so.supplier_id
       LEFT JOIN LATERAL (
         SELECT id, shipment_number, status
           FROM shipments
          WHERE supply_order_id = so.id
          ORDER BY attempt_number DESC
          LIMIT 1
       ) ls ON TRUE
       LEFT JOIN LATERAL (
         SELECT status, overall_result
           FROM inspections
          WHERE shipment_id = ls.id
          ORDER BY id DESC
          LIMIT 1
       ) li ON TRUE
       ${whereClause}
      ORDER BY CASE so.status
                 WHEN 'pending' THEN 0
                 WHEN 'confirmed' THEN 1
                 WHEN 'in_transit' THEN 2
                 WHEN 'arrived' THEN 3
                 WHEN 'inspecting' THEN 4
                 WHEN 'received' THEN 5
                 WHEN 'returned' THEN 6
                 ELSE 7
               END,
               so.order_date DESC, so.id DESC`,
    params,
  );

  const list = statusFilter ? all.filter((o) => o.status === statusFilter) : all;

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow={isSupplier ? 'Portal Supplier' : 'Pengadaan & Restock'}
        title="Permintaan Pasokan (PO)"
        subtitle={
          isSupplier
            ? 'Tinjau Restock Order (PO) dari Manager Gudang, konfirmasi kesanggupan, kirim barang (In Transit), dan serahkan bukti foto kedatangan.'
            : 'Buat Restock Order (PO) kepada Supplier, pantau pengiriman, instruksikan pemeriksaan fisik, dan validasi penerimaan.'
        }
        action={
          isManager && (
            <LinkButton href="/supply-orders/new" icon="plus">
              Buat Restock Order (PO)
            </LinkButton>
          )
        }
      />

      <FilterPills
        basePath="/supply-orders"
        active={statusFilter}
        items={[
          ['', 'Semua', all.length],
          ['pending', 'Pending', all.filter((o) => o.status === 'pending').length],
          ['confirmed', 'Confirmed', all.filter((o) => o.status === 'confirmed').length],
          ['in_transit', 'In Transit', all.filter((o) => o.status === 'in_transit').length],
          ['arrived', 'Arrived', all.filter((o) => o.status === 'arrived').length],
          ['inspecting', 'Inspecting', all.filter((o) => o.status === 'inspecting').length],
          ['received', 'Received', all.filter((o) => o.status === 'received').length],
          ['returned', 'Returned', all.filter((o) => o.status === 'returned').length],
          ['rejected', 'Rejected', all.filter((o) => o.status === 'rejected').length],
        ]}
      />

      <Card
        title={`Daftar Restock Order (${list.length})`}
        subtitle="Siklus status PO: Pending → Confirmed / Rejected → In Transit → Arrived → Inspecting → Received / Returned."
      >
        <DataTable
          head={[
            { label: 'No. PO & Supplier' },
            { label: 'Volume', align: 'right', hide: 'sm' },
            { label: 'Pengiriman & Pemeriksaan', hide: 'md' },
            { label: 'Status PO' },
            { label: 'Aksi', align: 'right' },
          ]}
          empty={list.length === 0}
          emptyText="Belum ada Restock Order (PO) pada filter ini."
        >
          {list.map((o) => (
            <tr key={o.id} className="hover:bg-[#faf9f5]">
              <td className={td}>
                <Link href={`/supply-orders/${o.id}`} className="font-mono text-[13px] font-bold text-lobeans-forest hover:underline">
                  {o.order_number}
                </Link>
                <p className="mt-0.5 text-[11.5px] font-semibold text-lobeans-ink">
                  {o.supplier_name} <span className="font-normal text-lobeans-muted">· {fmtDate(o.order_date)}</span>
                </p>
              </td>
              <td className={`${td} text-right ${hideCls('sm')}`}>
                <p className="font-bold text-lobeans-ink">{num(o.total_qty)} kg</p>
                <p className="text-[11px] text-lobeans-muted">{o.item_count} jenis kopi</p>
              </td>
              <td className={`${td} ${hideCls('md')}`}>
                {o.latest_shipment_number ? (
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-mono text-[11.5px] font-semibold text-lobeans-ink">{o.latest_shipment_number}</span>
                    {o.latest_shipment_status === 'inspecting' && o.latest_inspection_status === 'submitted' && (
                      <StatusBadge
                        status={o.latest_inspection_result}
                        label={o.latest_inspection_result === 'sesuai' ? 'Hasil: Sesuai' : 'Hasil: Tidak Sesuai'}
                      />
                    )}
                  </div>
                ) : (
                  <span className="text-[11.5px] text-lobeans-muted">Belum dikirim</span>
                )}
              </td>
              <td className={td}>
                <StatusBadge status={o.status} />
              </td>
              <td className={`${td} text-right`}>
                <div className="inline-flex items-center gap-2">
                  {isManager && o.status === 'pending' && (
                    <ActionButton
                      action={deleteSupplyOrderAction}
                      values={{ id: o.id }}
                      variant="danger"
                      confirm={`Yakin ingin menghapus permintaan pasokan ${o.order_number}?`}
                    >
                      Hapus
                    </ActionButton>
                  )}
                  <Link
                    href={`/supply-orders/${o.id}`}
                    className="inline-flex items-center rounded-lg border border-lobeans-border bg-white px-3 py-1.5 text-[11.5px] font-bold text-lobeans-forest transition-colors hover:bg-lobeans-forest hover:text-white"
                  >
                    Detail →
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}
