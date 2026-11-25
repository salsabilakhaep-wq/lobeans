import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { ROLE_LABEL } from '@/lib/constants.js';
import { fmtDateTime, num, rupiah } from '@/lib/format.js';
import {
  Card, DataTable, FilterPills, LinkButton, MetricCard, PageHeader, StatusBadge, StockBadge, hideCls, td,
} from '@/components/ui.js';

export const metadata = { title: 'Laporan & Audit' };

export default async function ReportsPage({ searchParams }) {
  const user = await requireUser(['admin', 'manager']);
  const sp = await searchParams;
  const tab = sp.tab || 'stock';

  const [categories, products, movements, shipments, logs] = await Promise.all([
    many(
      `SELECT c.id, c.name, COUNT(p.id)::int AS product_count,
              COALESCE(SUM(p.stock),0)::numeric AS total_stock,
              COALESCE(SUM(p.stock * p.buy_price),0)::numeric AS stock_value
         FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
        WHERE c.is_active = TRUE GROUP BY c.id ORDER BY c.id`,
    ),
    many('SELECT * FROM v_products WHERE is_active = TRUE ORDER BY stock ASC, name'),
    many(
      `SELECT sm.*, p.sku, p.name AS product_name, t.trx_number, u.name AS actor_name
         FROM stock_movements sm
         JOIN products p ON p.id = sm.product_id
         JOIN inventory_transactions t ON t.id = sm.transaction_id
         JOIN users u ON u.id = sm.actor_id
        ORDER BY sm.created_at DESC LIMIT 40`,
    ),
    many(
      `SELECT sh.id, sh.shipment_number, sh.attempt_number, sh.shipment_type, sh.status, sh.created_at,
              so.id AS supply_order_id, so.order_number, s.company_name AS supplier_name,
              i.overall_result, rt.status AS return_status
         FROM shipments sh
         JOIN supply_orders so ON so.id = sh.supply_order_id
         JOIN suppliers s ON s.id = so.supplier_id
         LEFT JOIN inspections i ON i.shipment_id = sh.id
         LEFT JOIN returns rt ON rt.shipment_id = sh.id
        ORDER BY sh.created_at DESC LIMIT 30`,
    ),
    many(
      `SELECT a.*, u.name AS actor_name
         FROM activity_logs a LEFT JOIN users u ON u.id = a.actor_id
        ORDER BY a.created_at DESC LIMIT 40`,
    ),
  ]);

  const totalStock = products.reduce((a, p) => a + Number(p.stock), 0);
  const totalValue = products.reduce((a, p) => a + Number(p.stock) * Number(p.buy_price), 0);
  const lowProducts = products.filter((p) => p.stock_status !== 'normal');
  const totalIn = movements.filter((m) => m.movement_type === 'IN').reduce((a, m) => a + Number(m.quantity_change), 0);
  const totalOut = movements.filter((m) => m.movement_type === 'OUT').reduce((a, m) => a + Math.abs(Number(m.quantity_change)), 0);

  return (
    <>
      <PageHeader
        eyebrow="Laporan Operasional"
        title="Laporan & Riwayat Aktivitas"
        subtitle="Ringkasan persediaan per kategori, riwayat mutasi stok, rekap pengiriman, dan catatan aktivitas gudang."
        action={
          <>
            <LinkButton href="/api/export/products" variant="secondary" icon="download">
              CSV Produk
            </LinkButton>
            <LinkButton href="/api/export/transactions" variant="secondary" icon="download">
              CSV Transaksi
            </LinkButton>
            <LinkButton href="/api/export/supply-orders" variant="secondary" icon="download">
              CSV Pasokan
            </LinkButton>
            {user.role === 'admin' && (
              <LinkButton href="/api/export/suppliers" variant="secondary" icon="download">
                CSV Supplier
              </LinkButton>
            )}
          </>
        }
      />

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Saldo Stok" value={`${num(totalStock)} kg`} note={`${products.length} produk aktif`} />
        <MetricCard label="Nilai Persediaan" value={rupiah(totalValue)} note="Berdasarkan harga beli" />
        <MetricCard label="Total Barang Masuk" value={`+${num(totalIn)} kg`} note="Dari transaksi IN disetujui" />
        <MetricCard label="Total Barang Keluar" value={`-${num(totalOut)} kg`} note="Dari transaksi OUT disetujui" />
      </div>

      <FilterPills
        basePath="/reports"
        param="tab"
        active={tab === 'stock' ? '' : tab}
        items={[
          ['', 'Stok & Kategori'],
          ['movements', 'Mutasi Stok', movements.length],
          ['shipments', 'Pengiriman & Retur', shipments.length],
          ['audit', 'Aktivitas Sistem', logs.length],
        ]}
      />

      {tab === 'stock' && (
        <div className="space-y-6">
          <Card title="Ringkasan Stok per Kategori" subtitle="Distribusi persediaan pada Arabika, Robusta, Liberika, dan Excelsa.">
            <DataTable
              head={[
                { label: 'Kategori' },
                { label: 'Produk', align: 'right' },
                { label: 'Total Stok', align: 'right' },
                { label: 'Nilai Aset', align: 'right' },
              ]}
            >
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-[#faf9f5]">
                  <td className={`${td} font-bold text-lobeans-ink`}>{c.name}</td>
                  <td className={`${td} text-right font-semibold tabular-nums`}>{c.product_count}</td>
                  <td className={`${td} text-right font-bold tabular-nums`}>{num(c.total_stock)} kg</td>
                  <td className={`${td} text-right font-semibold tabular-nums text-[#35463b]`}>{rupiah(c.stock_value)}</td>
                </tr>
              ))}
            </DataTable>
          </Card>

          <Card title={`Daftar Stok Rendah & Habis (${lowProducts.length})`} subtitle="Produk dengan status Out of Stock, Severe, atau Low.">
            <DataTable
              head={[
                { label: 'Produk & SKU' },
                { label: 'Kategori', hide: 'sm' },
                { label: 'Stok', align: 'right' },
                { label: 'Ambang Min / Low', align: 'right', hide: 'md' },
                { label: 'Status' },
              ]}
              empty={lowProducts.length === 0}
              emptyText="Seluruh produk berstatus Normal."
            >
              {lowProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#faf9f5]">
                  <td className={td}>
                    <p className="font-bold text-lobeans-ink">{p.name}</p>
                    <p className="font-mono text-[11px] text-lobeans-muted">{p.sku}</p>
                  </td>
                  <td className={`${td} ${hideCls('sm')} font-semibold`}>{p.category_name}</td>
                  <td className={`${td} text-right font-bold tabular-nums`}>{num(p.stock)} kg</td>
                  <td className={`${td} ${hideCls('md')} text-right tabular-nums text-lobeans-muted`}>
                    {num(p.min_stock)} / {num(p.low_stock)} kg
                  </td>
                  <td className={td}>
                    <StockBadge status={p.stock_status} />
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>
      )}

      {tab === 'movements' && (
        <Card title="Riwayat Mutasi Stok" subtitle="Catatan otomatis stok sebelum dan sesudah setiap transaksi IN maupun OUT yang disetujui.">
          <DataTable
            head={[
              { label: 'Waktu', hide: 'md' },
              { label: 'Produk & Transaksi' },
              { label: 'Sebelum', align: 'right', hide: 'sm' },
              { label: 'Perubahan', align: 'right' },
              { label: 'Sesudah', align: 'right' },
              { label: 'Aktor', hide: 'lg' },
            ]}
            empty={movements.length === 0}
          >
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-[#faf9f5]">
                <td className={`${td} ${hideCls('md')} whitespace-nowrap text-[11.5px] text-lobeans-muted`}>{fmtDateTime(m.created_at)}</td>
                <td className={td}>
                  <p className="font-bold text-lobeans-ink">{m.product_name}</p>
                  <Link href={`/transactions/${m.transaction_id}`} className="font-mono text-[11px] font-semibold text-[#284c35] hover:underline">
                    {m.trx_number}
                  </Link>
                </td>
                <td className={`${td} ${hideCls('sm')} text-right tabular-nums text-lobeans-muted`}>{num(m.stock_before)} kg</td>
                <td className={`${td} text-right font-bold tabular-nums ${m.movement_type === 'IN' ? 'text-emerald-700' : 'text-amber-900'}`}>
                  {Number(m.quantity_change) > 0 ? `+${num(m.quantity_change)}` : num(m.quantity_change)} kg
                </td>
                <td className={`${td} text-right font-bold tabular-nums`}>{num(m.stock_after)} kg</td>
                <td className={`${td} ${hideCls('lg')} text-lobeans-muted`}>{m.actor_name}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {tab === 'shipments' && (
        <Card title="Rekap Pengiriman, Pemeriksaan, Retur & Reshipment" subtitle="Penelusuran setiap shipment attempt beserta hasil pemeriksaan dan status retur.">
          <DataTable
            head={[
              { label: 'Shipment & Pengajuan' },
              { label: 'Supplier', hide: 'md' },
              { label: 'Tipe' },
              { label: 'Pemeriksaan', hide: 'sm' },
              { label: 'Status' },
              { label: 'Detail', align: 'right' },
            ]}
            empty={shipments.length === 0}
          >
            {shipments.map((s) => (
              <tr key={s.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{s.shipment_number}</p>
                  <p className="text-[11px] text-lobeans-muted">
                    {s.order_number} · Percobaan #{s.attempt_number}
                  </p>
                </td>
                <td className={`${td} ${hideCls('md')} font-semibold text-lobeans-ink`}>{s.supplier_name}</td>
                <td className={`${td} uppercase text-[11px] font-bold text-lobeans-muted`}>{s.shipment_type}</td>
                <td className={`${td} ${hideCls('sm')}`}>
                  {s.overall_result ? <StatusBadge status={s.overall_result} /> : <span className="text-lobeans-muted">—</span>}
                </td>
                <td className={td}>
                  <StatusBadge status={s.status} />
                </td>
                <td className={`${td} text-right`}>
                  <Link href={`/supply-orders/${s.supply_order_id}`} className="font-bold text-[#284c35] hover:underline">
                    Lihat →
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}

      {tab === 'audit' && (
        <Card title="Audit Trail (Activity Logs)" subtitle="Seluruh keputusan persetujuan, penolakan, pemeriksaan, dan perubahan status penting.">
          <DataTable
            head={[
              { label: 'Waktu', hide: 'sm' },
              { label: 'Aktor & Role' },
              { label: 'Tindakan', hide: 'md' },
              { label: 'Ringkasan' },
            ]}
            empty={logs.length === 0}
          >
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-[#faf9f5]">
                <td className={`${td} ${hideCls('sm')} whitespace-nowrap text-[11.5px] text-lobeans-muted`}>{fmtDateTime(l.created_at)}</td>
                <td className={td}>
                  <p className="font-bold text-lobeans-ink">{l.actor_name || 'Sistem'}</p>
                  <p className="text-[10.5px] text-lobeans-muted">{ROLE_LABEL[l.actor_role] || l.actor_role}</p>
                </td>
                <td className={`${td} ${hideCls('md')} font-mono text-[11px] text-lobeans-muted`}>{l.action}</td>
                <td className={`${td} text-[#35463b]`}>{l.summary}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}
    </>
  );
}
