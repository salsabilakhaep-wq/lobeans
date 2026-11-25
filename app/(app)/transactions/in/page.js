import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { fmtDate, fmtDateTime, num } from '@/lib/format.js';
import {
  Card, DataTable, FilterPills, Flash, LinkButton, MetricCard, PageHeader, StatusBadge, hideCls, td,
} from '@/components/ui.js';

export const metadata = { title: 'Barang Masuk (IN)' };

export default async function IncomingTransactionsPage({ searchParams }) {
  const user = await requireUser(['admin', 'manager', 'staff']);
  const sp = await searchParams;
  const statusFilter = sp.status || '';

  const [all, readyInspections] = await Promise.all([
    many(
      `SELECT t.*, u.name AS creator_name, a.name AS approver_name,
              so.order_number, sh.shipment_number,
              COALESCE(s1.company_name, s2.company_name) AS supplier_name,
              COALESCE((SELECT SUM(quantity) FROM inventory_transaction_items WHERE transaction_id = t.id), 0)::numeric AS total_qty
         FROM inventory_transactions t
         JOIN users u ON u.id = t.created_by
         LEFT JOIN users a ON a.id = t.approved_by
         LEFT JOIN supply_orders so ON so.id = t.supply_order_id
         LEFT JOIN shipments sh ON sh.id = t.shipment_id
         LEFT JOIN suppliers s1 ON s1.id = t.supplier_id
         LEFT JOIN suppliers s2 ON s2.id = so.supplier_id
        WHERE t.type = 'IN'
        ORDER BY CASE t.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, t.trx_date DESC, t.id DESC`,
    ),
    user.role === 'staff'
      ? many(
          `SELECT i.id AS inspection_id, i.submitted_at, sh.shipment_number, so.order_number,
                  s.company_name AS supplier_name,
                  COALESCE((SELECT SUM(actual_qty) FROM inspection_items WHERE inspection_id = i.id), 0)::numeric AS total_qty
             FROM inspections i
             JOIN shipments sh ON sh.id = i.shipment_id
             JOIN supply_orders so ON so.id = sh.supply_order_id
             JOIN suppliers s ON s.id = so.supplier_id
            WHERE i.status = 'submitted'
              AND i.overall_result = 'sesuai'
              AND (i.manager_decision IS NULL OR i.manager_decision <> 'refund')
              AND NOT EXISTS (
                SELECT 1 FROM inventory_transactions t
                 WHERE t.inspection_id = i.id AND t.status <> 'rejected'
              )
            ORDER BY i.submitted_at DESC`,
        )
      : Promise.resolve([]),
  ]);

  const list = statusFilter ? all.filter((t) => t.status === statusFilter) : all;
  const pendingCount = all.filter((t) => t.status === 'pending').length;
  const approvedCount = all.filter((t) => t.status === 'approved').length;
  const totalInKg = all.filter((t) => t.status === 'approved').reduce((a, t) => a + Number(t.total_qty), 0);

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow="Transaksi Persediaan"
        title="Barang Masuk (IN)"
        subtitle="Barang berstatus Pending adalah pengiriman yang telah lolos pemeriksaan fisik (Sesuai) dan diajukan catatan barang masuknya oleh Staff Gudang untuk dikonfirmasi Manager."
        action={
          <>
            <LinkButton href="/transactions/out" variant="secondary">
              Barang Keluar (OUT) →
            </LinkButton>
            {user.role === 'staff' && (
              <LinkButton href="/transactions/new?type=IN" icon="plus">
                Catat Barang Masuk
              </LinkButton>
            )}
          </>
        }
      />

      {user.role === 'staff' && readyInspections.length > 0 && (
        <div className="mb-6">
          <Card
            title={`Lolos Pemeriksaan — Siap Diajukan ke Barang Masuk (${readyInspections.length})`}
            subtitle="Hasil pemeriksaan fisik berikut berstatus Sesuai. Ajukan catatan Barang Masuk (IN) agar dapat dikonfirmasi Manager."
            className="border-emerald-300/80"
          >
            <DataTable
              head={[
                { label: 'Pengiriman & Pesanan' },
                { label: 'Supplier' },
                { label: 'Berat Aktual', align: 'right' },
                { label: 'Aksi', align: 'right' },
              ]}
            >
              {readyInspections.map((r) => (
                <tr key={r.inspection_id} className="bg-emerald-50/30 hover:bg-emerald-50/60">
                  <td className={td}>
                    <p className="font-mono font-bold text-lobeans-ink">{r.shipment_number}</p>
                    <p className="text-[11px] text-lobeans-muted">
                      {r.order_number} · Diperiksa {fmtDateTime(r.submitted_at)}
                    </p>
                  </td>
                  <td className={`${td} font-semibold text-lobeans-ink`}>{r.supplier_name}</td>
                  <td className={`${td} text-right font-bold tabular-nums text-emerald-700`}>+{num(r.total_qty)} kg</td>
                  <td className={`${td} text-right`}>
                    <Link
                      href={`/transactions/new?type=IN&inspection_id=${r.inspection_id}`}
                      className="inline-flex items-center rounded-lg bg-lobeans-forest px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-lobeans-forest-light"
                    >
                      Catat Barang Masuk →
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Menunggu Konfirmasi" value={num(pendingCount)} note="Lolos inspeksi · diajukan Staff" href="/transactions/in?status=pending" />
        <MetricCard label="Disetujui (Approved)" value={num(approvedCount)} note="Sudah masuk ke saldo stok" href="/transactions/in?status=approved" />
        <MetricCard label="Total Volume Masuk" value={`+${num(totalInKg)} kg`} note="Akumulasi barang masuk disetujui" />
      </div>

      <FilterPills
        basePath="/transactions/in"
        active={statusFilter}
        items={[
          ['', 'Semua', all.length],
          ['pending', 'Pending', pendingCount],
          ['approved', 'Approved', approvedCount],
          ['rejected', 'Rejected', all.filter((t) => t.status === 'rejected').length],
        ]}
      />

      <Card
        title={`Daftar Barang Masuk (${list.length})`}
        subtitle="Stok produk bertambah otomatis tepat satu kali setelah Manager menyetujui catatan Barang Masuk dari Staff."
      >
        <DataTable
          head={[
            { label: 'No. Transaksi' },
            { label: 'Supplier & Referensi PO' },
            { label: 'Diajukan Staff', hide: 'md' },
            { label: 'Kuantitas', align: 'right' },
            { label: 'Status' },
            { label: 'Aksi', align: 'right' },
          ]}
          empty={list.length === 0}
          emptyText="Belum ada transaksi Barang Masuk pada filter ini."
        >
          {list.map((t) => (
            <tr key={t.id} className="hover:bg-[#faf9f5]">
              <td className={td}>
                <Link href={`/transactions/${t.id}`} className="font-mono font-bold text-lobeans-forest hover:underline">
                  {t.trx_number}
                </Link>
                <p className="text-[11px] text-lobeans-muted">{fmtDate(t.trx_date)}</p>
              </td>
              <td className={td}>
                <p className="font-bold text-lobeans-ink">{t.supplier_name || 'Penerimaan Gudang'}</p>
                <p className="font-mono text-[11px] text-lobeans-muted">
                  {t.order_number || '-'} {t.shipment_number ? `· ${t.shipment_number}` : ''}
                </p>
              </td>
              <td className={`${td} ${hideCls('md')} text-lobeans-muted`}>{t.creator_name}</td>
              <td className={`${td} text-right font-bold tabular-nums text-emerald-700`}>
                +{num(t.total_qty)} kg
              </td>
              <td className={td}>
                <StatusBadge status={t.status} />
              </td>
              <td className={`${td} text-right`}>
                <Link
                  href={`/transactions/${t.id}`}
                  className="inline-flex items-center rounded-lg border border-lobeans-border bg-white px-3 py-1.5 text-[11.5px] font-bold text-lobeans-forest transition-colors hover:bg-lobeans-forest hover:text-white"
                >
                  {user.role === 'manager' && t.status === 'pending' ? 'Konfirmasi →' : 'Detail →'}
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}
