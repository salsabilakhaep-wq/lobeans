import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { fmtDate, num } from '@/lib/format.js';
import {
  Card, DataTable, FilterPills, Flash, LinkButton, MetricCard, PageHeader, StatusBadge, hideCls, td,
} from '@/components/ui.js';

export const metadata = { title: 'Barang Keluar (OUT)' };

export default async function OutgoingTransactionsPage({ searchParams }) {
  const user = await requireUser(['admin', 'manager', 'staff']);
  const sp = await searchParams;
  const statusFilter = sp.status || '';

  const all = await many(
    `SELECT t.*, u.name AS creator_name, a.name AS approver_name,
            COALESCE((SELECT SUM(quantity) FROM inventory_transaction_items WHERE transaction_id = t.id), 0)::numeric AS total_qty
       FROM inventory_transactions t
       JOIN users u ON u.id = t.created_by
       LEFT JOIN users a ON a.id = t.approved_by
      WHERE t.type = 'OUT'
      ORDER BY CASE t.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'shipped' THEN 2 ELSE 3 END, t.trx_date DESC, t.id DESC`,
  );

  const list = statusFilter ? all.filter((t) => t.status === statusFilter) : all;
  const pendingCount = all.filter((t) => t.status === 'pending').length;
  const readyShipCount = all.filter((t) => t.status === 'approved').length;
  const shippedCount = all.filter((t) => t.status === 'shipped').length;

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow="Distribusi & Pengiriman"
        title="Barang Keluar (OUT)"
        subtitle="Kelola pengajuan pengeluaran green bean untuk pelanggan, persetujuan Manager, hingga status pengiriman (Shipped)."
        action={
          <>
            <LinkButton href="/transactions/in" variant="secondary">
              ← Barang Masuk (IN)
            </LinkButton>
            {user.role === 'staff' && (
              <LinkButton href="/transactions/new?type=OUT" icon="plus">
                Buat Barang Keluar
              </LinkButton>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Menunggu Persetujuan" value={num(pendingCount)} note="Perlu persetujuan Manager" href="/transactions/out?status=pending" />
        <MetricCard label="Siap Packing (Approved)" value={num(readyShipCount)} note="Stok belum dipotong · siap packing" href="/transactions/out?status=approved" />
        <MetricCard label="Terkirim (Shipped)" value={num(shippedCount)} note="Stok dipotong & pengiriman selesai" href="/transactions/out?status=shipped" />
      </div>

      <FilterPills
        basePath="/transactions/out"
        active={statusFilter}
        items={[
          ['', 'Semua', all.length],
          ['pending', 'Pending', pendingCount],
          ['approved', 'Approved', readyShipCount],
          ['shipped', 'Shipped', shippedCount],
          ['rejected', 'Rejected', all.filter((t) => t.status === 'rejected').length],
        ]}
      />

      <Card
        title={`Daftar Barang Keluar (${list.length})`}
        subtitle="Manager menyetujui (Approved) untuk packing; saldo stok berkurang otomatis saat Staff menekan Kirim Barang (Shipped)."
      >
        <DataTable
          head={[
            { label: 'No. Transaksi' },
            { label: 'Penerima & Tujuan' },
            { label: 'Diajukan Oleh', hide: 'md' },
            { label: 'Kuantitas', align: 'right' },
            { label: 'Status' },
            { label: 'Aksi', align: 'right' },
          ]}
          empty={list.length === 0}
          emptyText="Belum ada transaksi Barang Keluar pada filter ini."
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
                <p className="font-bold text-lobeans-ink">{t.recipient_name}</p>
                <p className="text-[11px] text-lobeans-muted">{t.destination}</p>
              </td>
              <td className={`${td} ${hideCls('md')} text-lobeans-muted`}>{t.creator_name}</td>
              <td className={`${td} text-right font-bold tabular-nums text-amber-900`}>
                -{num(t.total_qty)} kg
              </td>
              <td className={td}>
                <StatusBadge status={t.status} />
              </td>
              <td className={`${td} text-right`}>
                <Link
                  href={`/transactions/${t.id}`}
                  className="inline-flex items-center rounded-lg border border-lobeans-border bg-white px-3 py-1.5 text-[11.5px] font-bold text-lobeans-forest transition-colors hover:bg-lobeans-forest hover:text-white"
                >
                  {user.role === 'manager' && t.status === 'pending'
                    ? 'Konfirmasi →'
                    : user.role === 'staff' && t.status === 'approved'
                      ? 'Kirim →'
                      : 'Detail →'}
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}
