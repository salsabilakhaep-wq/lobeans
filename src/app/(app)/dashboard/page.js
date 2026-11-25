import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many, one } from '@/lib/db.js';
import { ROLE_LABEL } from '@/lib/constants.js';
import { fmtDate, fmtDateTime, num, rupiah } from '@/lib/format.js';
import { deleteSupplyOrderAction } from '@/app/actions/supply.js';
import { toggleProductActiveAction } from '@/app/actions/products.js';
import { ActionButton } from '@/components/ActionForm.js';
import { SupplierVerifyActions } from '@/components/SupplierVerifyActions.js';
import {
  Card, DataTable, Flash, HeroDashboard, LinkButton, MetricCard, SectionTitle, StatusBadge, StockBadge, hideCls, td,
} from '@/components/ui.js';

export const metadata = { title: 'Dashboard' };

const more = (href, label = 'Lihat semua →') => (
  <Link href={href} className="text-[12px] font-bold text-[#284c35] hover:underline">
    {label}
  </Link>
);

/* ═══════════════════════════ 1. ADMIN ═══════════════════════════ */

async function AdminDashboard({ user }) {
  const [stats, pendingSuppliers, categories, alerts, logs] = await Promise.all([
    one(`SELECT
           (SELECT COUNT(*) FROM products WHERE is_active = TRUE)::int AS products,
           (SELECT COUNT(*) FROM inventory_transactions WHERE date_trunc('month', trx_date) = date_trunc('month', CURRENT_DATE))::int AS monthly_trx,
           (SELECT COALESCE(SUM(stock * buy_price),0) FROM products WHERE is_active = TRUE)::numeric AS inventory_value,
           (SELECT COUNT(*) FROM suppliers WHERE verification_status = 'pending')::int AS pending_suppliers`),
    many(`SELECT s.*, u.email AS account_email
            FROM suppliers s
            LEFT JOIN users u ON u.supplier_id = s.id
           WHERE s.verification_status = 'pending'
           ORDER BY s.created_at ASC LIMIT 5`),
    many(`SELECT c.id, c.name, COUNT(p.id)::int AS product_count, COALESCE(SUM(p.stock),0)::numeric AS total_stock
            FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
           WHERE c.is_active = TRUE GROUP BY c.id ORDER BY c.id`),
    many(`SELECT id, sku, name, category_name, stock, min_stock, unit, stock_status
            FROM v_products WHERE is_active = TRUE AND stock_status <> 'normal' ORDER BY stock ASC LIMIT 6`),
    many(`SELECT a.*, u.name AS actor_name
            FROM activity_logs a LEFT JOIN users u ON u.id = a.actor_id
           ORDER BY a.created_at DESC LIMIT 6`),
  ]);

  return (
    <>
      <HeroDashboard
        roleTag="Dashboard Admin"
        greeting={`Selamat datang, ${user.name.split(' ')[0]}.`}
        subtitle="Kelola katalog produk, kategori kopi, tambah akun Staff/Manager/Supplier, verifikasi mitra baru, serta pantau seluruh aktivitas gudang LOBEANS."
        ctaLabel="+  Tambah Pengguna"
        ctaHref="/users/new"
        secondaryLabel="Tambah produk →"
        secondaryHref="/products/new"
        contextTitle="Kontrol Sistem"
        contextNote="Akun Pengguna, Master Data & Laporan"
      />

      <SectionTitle title="Ringkasan Gudang" subtitle="Kondisi produk, nilai persediaan, dan antrean verifikasi terkini." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Produk Aktif" value={num(stats.products)} note="Katalog green bean" href="/products" />
        <MetricCard label="Transaksi Bulan Ini" value={num(stats.monthly_trx)} note="Barang masuk & keluar" href="/reports" />
        <MetricCard label="Nilai Inventori" value={rupiah(stats.inventory_value)} note="Estimasi nilai persediaan" href="/reports" />
        <MetricCard
          label="Supplier Menunggu Verifikasi"
          value={num(stats.pending_suppliers)}
          note={stats.pending_suppliers > 0 ? 'Perlu persetujuan Anda' : 'Semua terverifikasi'}
          href="/suppliers"
        />
      </div>

      {/* Tambah Pengguna Cepat (Staff, Manager, Supplier) */}
      <div className="mt-7">
        <Card
          title="Tambah Pengguna Baru"
          subtitle="Buat akun operasional baru untuk Staff Gudang, Manager Gudang, atau mitra Supplier langsung dari dashboard."
          action={more('/users', 'Kelola semua akun →')}
          padded
        >
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Link
              href="/users/new?role=staff"
              className="group flex items-center justify-between rounded-[14px] border border-[#e5e4dc] bg-[#faf9f5] px-4 py-3.5 transition-all hover:border-lobeans-forest hover:bg-white"
            >
              <div>
                <p className="text-[13.5px] font-bold text-lobeans-ink">+ Tambah Staff Gudang</p>
                <p className="mt-0.5 text-[11px] text-lobeans-muted">Inspeksi fisik, catatan IN &amp; pengiriman OUT</p>
              </div>
              <span className="font-bold text-lobeans-forest transition-transform group-hover:translate-x-0.5">→</span>
            </Link>

            <Link
              href="/users/new?role=manager"
              className="group flex items-center justify-between rounded-[14px] border border-[#e5e4dc] bg-[#faf9f5] px-4 py-3.5 transition-all hover:border-lobeans-forest hover:bg-white"
            >
              <div>
                <p className="text-[13.5px] font-bold text-lobeans-ink">+ Tambah Manager Gudang</p>
                <p className="mt-0.5 text-[11px] text-lobeans-muted">Restock PO, persetujuan IN/OUT &amp; katalog</p>
              </div>
              <span className="font-bold text-lobeans-forest transition-transform group-hover:translate-x-0.5">→</span>
            </Link>

            <Link
              href="/users/new?role=supplier"
              className="group flex items-center justify-between rounded-[14px] border border-[#e5e4dc] bg-[#faf9f5] px-4 py-3.5 transition-all hover:border-lobeans-mustard hover:bg-white"
            >
              <div>
                <p className="text-[13.5px] font-bold text-lobeans-ink">+ Tambah Supplier</p>
                <p className="mt-0.5 text-[11px] text-lobeans-muted">Buat profil mitra &amp; akun login sekaligus</p>
              </div>
              <span className="font-bold text-[#9c6b04] transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </Card>
      </div>

      {pendingSuppliers.length > 0 && (
        <div className="mt-7">
          <Card
            title={`Verifikasi Supplier Baru (${pendingSuppliers.length})`}
            subtitle="Setujui atau tolak pendaftaran mitra supplier langsung dari dashboard."
            action={more('/suppliers', 'Kelola supplier →')}
            className="border-amber-300/80"
          >
            <DataTable
              head={[
                { label: 'Perusahaan & Lokasi' },
                { label: 'Penanggung Jawab' },
                { label: 'Status' },
                { label: 'Aksi', align: 'right' },
              ]}
            >
              {pendingSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-[#faf9f5]">
                  <td className={td}>
                    <p className="font-bold text-lobeans-ink">{s.company_name}</p>
                    <p className="text-[11px] text-lobeans-muted">{s.address || s.supplier_code}</p>
                  </td>
                  <td className={td}>
                    <p className="font-semibold text-lobeans-ink">{s.contact_name}</p>
                    <p className="font-mono text-[11px] text-lobeans-muted">{s.phone}</p>
                  </td>
                  <td className={td}>
                    <StatusBadge status="pending" label="Pending" />
                  </td>
                  <td className={`${td} text-right`}>
                    <SupplierVerifyActions supplierId={s.id} />
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>
      )}

      <SectionTitle title="Stok per Kategori Kopi" subtitle="Distribusi stok green bean pada setiap kategori." action={more('/categories', 'Kelola kategori →')} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.id}`}
            className="rounded-[14px] border border-[#e5e4dc] bg-white px-5 py-4 transition-colors hover:border-lobeans-mustard"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-lobeans-mustard" />
              <p className="text-[14px] font-bold text-lobeans-ink">{c.name}</p>
            </div>
            <p className="mt-2.5 text-[24px] font-bold tracking-tight text-lobeans-ink tabular-nums">
              {num(c.total_stock)} <span className="text-[12px] font-medium text-lobeans-muted">kg</span>
            </p>
            <p className="text-[11px] text-lobeans-muted">{c.product_count} produk aktif</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        <Card title="Peringatan Stok Rendah & Habis" subtitle="Produk dengan status Out of Stock, Severe, atau Low." action={more('/products?status=alert')}>
          <DataTable
            head={[
              { label: 'Produk & SKU' },
              { label: 'Kategori', hide: 'sm' },
              { label: 'Stok', align: 'right' },
              { label: 'Minimum', align: 'right', hide: 'md' },
              { label: 'Status' },
            ]}
            empty={alerts.length === 0}
            emptyText="Semua stok produk dalam kondisi Normal."
          >
            {alerts.map((p) => (
              <tr key={p.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <Link href={`/products/${p.id}`} className="font-bold text-lobeans-ink hover:text-lobeans-forest hover:underline">
                    {p.name}
                  </Link>
                  <p className="font-mono text-[11px] text-lobeans-muted">{p.sku}</p>
                </td>
                <td className={`${td} ${hideCls('sm')} font-medium text-[#435549]`}>{p.category_name}</td>
                <td className={`${td} text-right font-bold tabular-nums`}>
                  {num(p.stock)} {p.unit}
                </td>
                <td className={`${td} ${hideCls('md')} text-right tabular-nums text-lobeans-muted`}>
                  {num(p.min_stock)} {p.unit}
                </td>
                <td className={td}>
                  <StockBadge status={p.stock_status} />
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        <Card title="Aktivitas Sistem Terbaru" subtitle="Catatan operasional terbaru di seluruh modul gudang." action={more('/reports?tab=audit', 'Audit lengkap →')}>
          <DataTable
            head={[
              { label: 'Waktu', hide: 'sm' },
              { label: 'Aktor' },
              { label: 'Ringkasan Aktivitas' },
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
                <td className={`${td} text-[#35463b]`}>{l.summary}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>
    </>
  );
}

/* ═══════════════════════════ 2. MANAGER GUDANG ═══════════════════════════ */

async function ManagerDashboard({ user }) {
  const [kpi, inQueue, outQueue, supplyQueue, lowStockProducts] = await Promise.all([
    one(`SELECT
           (SELECT COUNT(*) FROM inventory_transactions WHERE type = 'IN' AND status = 'pending')::int AS pending_in,
           (SELECT COUNT(*) FROM inventory_transactions WHERE type = 'OUT' AND status = 'pending')::int AS pending_out,
           (SELECT COUNT(*) FROM v_products WHERE is_active = TRUE AND stock_status <> 'normal')::int AS low_alerts,
           (SELECT COALESCE(SUM(stock),0) FROM products WHERE is_active = TRUE)::numeric AS total_stock`),
    many(`SELECT t.id, t.trx_number, t.trx_date, t.status,
                 so.order_number, COALESCE(s1.company_name, s2.company_name) AS supplier_name,
                 u.name AS creator_name,
                 COALESCE((SELECT SUM(quantity) FROM inventory_transaction_items WHERE transaction_id = t.id),0)::numeric AS total_qty
            FROM inventory_transactions t
            JOIN users u ON u.id = t.created_by
            LEFT JOIN supply_orders so ON so.id = t.supply_order_id
            LEFT JOIN suppliers s1 ON s1.id = t.supplier_id
            LEFT JOIN suppliers s2 ON s2.id = so.supplier_id
           WHERE t.type = 'IN' AND t.status = 'pending'
           ORDER BY t.created_at ASC LIMIT 6`),
    many(`SELECT t.id, t.trx_number, t.trx_date, t.status, t.recipient_name, t.destination,
                 u.name AS creator_name,
                 COALESCE((SELECT SUM(quantity) FROM inventory_transaction_items WHERE transaction_id = t.id),0)::numeric AS total_qty
            FROM inventory_transactions t
            JOIN users u ON u.id = t.created_by
           WHERE t.type = 'OUT' AND t.status = 'pending'
           ORDER BY t.created_at ASC LIMIT 6`),
    many(`SELECT so.id, so.order_number, so.order_date, so.status, s.company_name AS supplier_name,
                 COALESCE((SELECT SUM(quantity) FROM supply_order_items WHERE supply_order_id = so.id),0)::numeric AS total_qty,
                 (SELECT sh.status FROM shipments sh WHERE sh.supply_order_id = so.id ORDER BY sh.attempt_number DESC LIMIT 1) AS shipment_status,
                 (SELECT i.status FROM shipments sh JOIN inspections i ON i.shipment_id = sh.id WHERE sh.supply_order_id = so.id ORDER BY sh.attempt_number DESC LIMIT 1) AS inspection_status
            FROM supply_orders so
            JOIN suppliers s ON s.id = so.supplier_id
           WHERE so.status IN ('pending', 'confirmed', 'in_transit', 'arrived', 'inspecting')
           ORDER BY so.updated_at DESC
           LIMIT 6`),
    many(`SELECT id, sku, name, category_name, stock, min_stock, low_stock, unit, stock_status
            FROM v_products
           WHERE is_active = TRUE AND stock_status <> 'normal'
           ORDER BY stock ASC LIMIT 6`),
  ]);

  return (
    <>
      <HeroDashboard
        roleTag="Dashboard Manager Gudang"
        greeting={`Selamat datang, ${user.name.split(' ')[0]}.`}
        subtitle="Konfirmasi barang masuk dan barang keluar secara terpisah, buat permintaan pasokan ke supplier, dan kelola katalog produk gudang."
        ctaLabel="+  Buat Permintaan Pasokan"
        ctaHref="/supply-orders/new"
        secondaryLabel="Kelola produk & kategori →"
        secondaryHref="/products"
        contextTitle="Kontrol Operasional"
        contextNote="Konfirmasi IN & OUT · Pengadaan & Katalog"
      />

      <SectionTitle title="Ringkasan Persetujuan & Stok" subtitle="Prioritas tindakan yang membutuhkan konfirmasi Anda." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Barang Masuk (IN) Pending" value={num(kpi.pending_in)} note="Siap dikonfirmasi masuk stok" href="/transactions/in?status=pending" />
        <MetricCard label="Barang Keluar (OUT) Pending" value={num(kpi.pending_out)} note="Menunggu persetujuan keluar" href="/transactions/out?status=pending" />
        <MetricCard label="Peringatan Stok Rendah" value={num(kpi.low_alerts)} note="Out of Stock / Severe / Low" href="/products?status=alert" />
        <MetricCard label="Total Stok Gudang" value={`${num(kpi.total_stock)} kg`} note="Saldo seluruh produk aktif" href="/products" />
      </div>

      <div className="mt-8 space-y-6">
        {/* 1. KONFIRMASI BARANG MASUK (IN) — TERPISAH */}
        <Card
          title={`Konfirmasi Barang Masuk (IN) · ${inQueue.length} Pending`}
          subtitle="Barang yang telah lolos pemeriksaan fisik (Sesuai) dan diajukan catatan barang masuknya oleh Staff Gudang."
          action={more('/transactions/in', 'Semua Barang Masuk →')}
        >
          <DataTable
            head={[
              { label: 'No. Transaksi' },
              { label: 'Supplier & Referensi' },
              { label: 'Kuantitas', align: 'right' },
              { label: 'Status' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={inQueue.length === 0}
            emptyText="Tidak ada transaksi Barang Masuk (IN) yang menunggu konfirmasi."
          >
            {inQueue.map((t) => (
              <tr key={t.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{t.trx_number}</p>
                  <p className="text-[11px] text-lobeans-muted">{fmtDate(t.trx_date)}</p>
                </td>
                <td className={td}>
                  <p className="font-bold text-lobeans-ink">{t.supplier_name || 'Penerimaan Gudang'}</p>
                  <p className="font-mono text-[11px] text-lobeans-muted">{t.order_number || t.creator_name}</p>
                </td>
                <td className={`${td} text-right font-bold tabular-nums text-emerald-700`}>+{num(t.total_qty)} kg</td>
                <td className={td}>
                  <StatusBadge status={t.status} />
                </td>
                <td className={`${td} text-right`}>
                  <Link href={`/transactions/${t.id}`} className="font-bold text-[#284c35] hover:underline">
                    Konfirmasi IN →
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        {/* 2. KONFIRMASI BARANG KELUAR (OUT) — TERPISAH */}
        <Card
          title={`Konfirmasi Barang Keluar (OUT) · ${outQueue.length} Pending`}
          subtitle="Tinjau dan setujui pengajuan pengiriman ke pelanggan sebelum barang dikeluarkan."
          action={more('/transactions/out', 'Semua Barang Keluar →')}
        >
          <DataTable
            head={[
              { label: 'No. Transaksi' },
              { label: 'Penerima & Tujuan' },
              { label: 'Kuantitas', align: 'right' },
              { label: 'Status' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={outQueue.length === 0}
            emptyText="Tidak ada transaksi Barang Keluar (OUT) yang menunggu konfirmasi."
          >
            {outQueue.map((t) => (
              <tr key={t.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{t.trx_number}</p>
                  <p className="text-[11px] text-lobeans-muted">{fmtDate(t.trx_date)}</p>
                </td>
                <td className={td}>
                  <p className="font-bold text-lobeans-ink">{t.recipient_name}</p>
                  <p className="text-[11px] text-lobeans-muted">{t.destination}</p>
                </td>
                <td className={`${td} text-right font-bold tabular-nums text-amber-900`}>-{num(t.total_qty)} kg</td>
                <td className={td}>
                  <StatusBadge status={t.status} />
                </td>
                <td className={`${td} text-right`}>
                  <Link href={`/transactions/${t.id}`} className="font-bold text-[#284c35] hover:underline">
                    Konfirmasi OUT →
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        {/* 3. PERMINTAAN PASOKAN KE SUPPLIER */}
        <Card
          title="Permintaan Pasokan & Pengiriman Aktif"
          subtitle="Pantau konfirmasi supplier, barang tiba (Arrived), dan laporan pemeriksaan fisik dari Staff."
          action={
            <div className="flex items-center gap-3">
              <LinkButton href="/supply-orders/new" size="sm" icon="plus">
                Minta Pasokan
              </LinkButton>
              {more('/supply-orders')}
            </div>
          }
        >
          <DataTable
            head={[
              { label: 'No. Pesanan' },
              { label: 'Supplier' },
              { label: 'Berat', align: 'right' },
              { label: 'Status Pesanan' },
              { label: 'Tahap Pengiriman', hide: 'md' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={supplyQueue.length === 0}
            emptyText="Tidak ada permintaan pasokan yang sedang berjalan."
          >
            {supplyQueue.map((o) => (
              <tr key={o.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{o.order_number}</p>
                  <p className="text-[11px] text-lobeans-muted">{fmtDate(o.order_date)}</p>
                </td>
                <td className={`${td} font-semibold text-lobeans-ink`}>{o.supplier_name}</td>
                <td className={`${td} text-right font-bold tabular-nums`}>{num(o.total_qty)} kg</td>
                <td className={td}>
                  <StatusBadge status={o.status} />
                </td>
                <td className={`${td} ${hideCls('md')}`}>
                  {o.shipment_status ? (
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={o.shipment_status} />
                      {o.inspection_status === 'submitted' && o.shipment_status === 'inspecting' && (
                        <span className="text-[10.5px] font-bold text-emerald-700">Laporan siap</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-lobeans-muted">—</span>
                  )}
                </td>
                <td className={`${td} text-right`}>
                  <div className="inline-flex items-center gap-2.5">
                    {o.status === 'pending' && (
                      <ActionButton
                        action={deleteSupplyOrderAction}
                        values={{ id: o.id }}
                        variant="danger"
                        confirm={`Yakin ingin menghapus permintaan pasokan ${o.order_number}?`}
                      >
                        Hapus
                      </ActionButton>
                    )}
                    <Link href={`/supply-orders/${o.id}`} className="font-bold text-[#284c35] hover:underline">
                      Tinjau →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        {/* 4. KELOLA PRODUK & PERINGATAN STOK */}
        <Card
          title="Kelola Produk & Peringatan Stok"
          subtitle="Produk yang masih memiliki stok (> 0) tidak boleh dihapus — habiskan stok terlebih dahulu atau kelola katalog."
          action={
            <div className="flex items-center gap-2">
              <LinkButton href="/products/new" size="sm" variant="secondary" icon="plus">
                Tambah Produk
              </LinkButton>
              <LinkButton href="/categories" size="sm" variant="secondary">
                Kategori
              </LinkButton>
            </div>
          }
        >
          <DataTable
            head={[
              { label: 'Produk & SKU' },
              { label: 'Kategori', hide: 'sm' },
              { label: 'Stok Saat Ini', align: 'right' },
              { label: 'Status' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={lowStockProducts.length === 0}
            emptyText="Seluruh produk berada pada level stok Normal."
          >
            {lowStockProducts.map((p) => (
              <tr key={p.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <Link href={`/products/${p.id}`} className="font-bold text-lobeans-ink hover:text-lobeans-forest hover:underline">
                    {p.name}
                  </Link>
                  <p className="font-mono text-[11px] text-lobeans-muted">{p.sku}</p>
                </td>
                <td className={`${td} ${hideCls('sm')} font-medium text-[#435549]`}>{p.category_name}</td>
                <td className={`${td} text-right font-bold tabular-nums`}>
                  {num(p.stock)} {p.unit}
                  <span className="block text-[10px] font-normal text-lobeans-muted">min {num(p.min_stock)}</span>
                </td>
                <td className={td}>
                  <StockBadge status={p.stock_status} />
                </td>
                <td className={`${td} text-right`}>
                  <div className="inline-flex flex-wrap items-center justify-end gap-2.5">
                    <Link href={`/products/${p.id}/edit`} className="font-semibold text-lobeans-muted hover:text-lobeans-ink">
                      Ubah
                    </Link>
                    <ActionButton
                      action={toggleProductActiveAction}
                      values={{ id: p.id, next_active: 'false' }}
                      variant="danger"
                      alertTitle="Produk Tidak Dapat Dihapus"
                      alertOnError
                      blockedMessage={
                        Number(p.stock) > 0
                          ? `Produk "${p.name}" tidak dapat dihapus karena masih memiliki stok tersisa sebesar ${num(p.stock)} ${p.unit}. Habiskan stok terlebih dahulu sebelum menghapus produk.`
                          : undefined
                      }
                      confirm={
                        Number(p.stock) === 0
                          ? `Yakin ingin menghapus produk "${p.name}"?`
                          : undefined
                      }
                    >
                      Hapus
                    </ActionButton>
                    <LinkButton href={`/supply-orders/new?product_id=${p.id}`} size="sm" variant="primary" icon="plus">
                      Permintaan PO
                    </LinkButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>
    </>
  );
}

/* ═══════════════════════════ 3. STAFF GUDANG ═══════════════════════════ */

async function StaffDashboard({ user }) {
  const [kpi, inspQueue, readyInQueue, outQueue] = await Promise.all([
    one(`SELECT
           (SELECT COUNT(*) FROM shipments sh JOIN inspections i ON i.shipment_id = sh.id WHERE sh.status = 'inspecting' AND i.status = 'pending')::int AS to_inspect,
           (SELECT COUNT(*) FROM inspections i
             WHERE i.status = 'submitted' AND i.overall_result = 'sesuai'
               AND (i.manager_decision IS NULL OR i.manager_decision <> 'refund')
               AND NOT EXISTS (SELECT 1 FROM inventory_transactions t WHERE t.inspection_id = i.id AND t.status <> 'rejected'))::int AS ready_in,
           (SELECT COUNT(*) FROM inventory_transactions WHERE type = 'OUT' AND status = 'approved')::int AS ready_ship,
           (SELECT COALESCE(SUM(stock),0) FROM products WHERE is_active = TRUE)::numeric AS total_stock`),
    many(`SELECT sh.id AS shipment_id, sh.shipment_number, sh.attempt_number, sh.arrived_at,
                 so.id AS supply_order_id, so.order_number, s.company_name AS supplier_name,
                 COALESCE((SELECT SUM(quantity) FROM supply_order_items WHERE supply_order_id = so.id),0)::numeric AS total_qty
            FROM shipments sh
            JOIN inspections i ON i.shipment_id = sh.id
            JOIN supply_orders so ON so.id = sh.supply_order_id
            JOIN suppliers s ON s.id = so.supplier_id
           WHERE sh.status = 'inspecting' AND i.status = 'pending'
           ORDER BY sh.arrived_at ASC`),
    many(`SELECT i.id AS inspection_id, sh.shipment_number, so.order_number, s.company_name AS supplier_name,
                 COALESCE((SELECT SUM(actual_qty) FROM inspection_items WHERE inspection_id = i.id),0)::numeric AS total_qty
            FROM inspections i
            JOIN shipments sh ON sh.id = i.shipment_id
            JOIN supply_orders so ON so.id = sh.supply_order_id
            JOIN suppliers s ON s.id = so.supplier_id
           WHERE i.status = 'submitted' AND i.overall_result = 'sesuai'
             AND (i.manager_decision IS NULL OR i.manager_decision <> 'refund')
             AND NOT EXISTS (SELECT 1 FROM inventory_transactions t WHERE t.inspection_id = i.id AND t.status <> 'rejected')
           ORDER BY i.submitted_at DESC`),
    many(`SELECT t.id, t.trx_number, t.trx_date, t.recipient_name, t.destination, t.status,
                 COALESCE((SELECT SUM(quantity) FROM inventory_transaction_items WHERE transaction_id = t.id),0)::numeric AS total_qty
            FROM inventory_transactions t
           WHERE t.type = 'OUT' AND t.status IN ('pending', 'approved')
           ORDER BY CASE t.status WHEN 'approved' THEN 0 ELSE 1 END, t.created_at DESC LIMIT 8`),
  ]);

  return (
    <>
      <HeroDashboard
        roleTag="Dashboard Staff Gudang"
        greeting={`Selamat datang, ${user.name.split(' ')[0]}.`}
        subtitle="Lakukan pemeriksaan fisik barang tiba beserta foto bukti, ajukan catatan barang masuk dari hasil pemeriksaan sesuai, dan proses pengiriman barang keluar."
        ctaLabel="+  Buat Barang Keluar (OUT)"
        ctaHref="/transactions/new?type=OUT"
        secondaryLabel="Lihat pemeriksaan barang →"
        secondaryHref="/inspections"
        contextTitle="Operasional Gudang"
        contextNote="Pemeriksaan Fisik, Barang Masuk & Keluar"
      />

      <SectionTitle title="Tugas Hari Ini" subtitle="Prioritas pekerjaan operasional gudang." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Perlu Diperiksa" value={num(kpi.to_inspect)} note="Instruksi dari Manager" href="/inspections" />
        <MetricCard label="Siap Catat Barang Masuk" value={num(kpi.ready_in)} note="Pemeriksaan Sesuai → ajukan IN" href="/transactions/in" />
        <MetricCard label="OUT Siap Dikirim" value={num(kpi.ready_ship)} note="Approved → unggah foto Shipped" href="/transactions/out?status=approved" />
        <MetricCard label="Total Stok Gudang" value={`${num(kpi.total_stock)} kg`} note="Seluruh produk aktif" href="/products" />
      </div>

      <div className="mt-8 space-y-6">
        {readyInQueue.length > 0 && (
          <Card
            title={`Lolos Pemeriksaan — Catat Barang Masuk (${readyInQueue.length})`}
            subtitle="Hasil pemeriksaan Sesuai berikut perlu diajukan ke Barang Masuk (IN) agar dapat dikonfirmasi Manager."
            className="border-emerald-300/80"
          >
            <DataTable
              head={[
                { label: 'Pengiriman & Pesanan' },
                { label: 'Supplier' },
                { label: 'Berat', align: 'right' },
                { label: 'Aksi', align: 'right' },
              ]}
            >
              {readyInQueue.map((r) => (
                <tr key={r.inspection_id} className="bg-emerald-50/25 hover:bg-emerald-50/50">
                  <td className={td}>
                    <p className="font-mono font-bold text-lobeans-ink">{r.shipment_number}</p>
                    <p className="text-[11px] text-lobeans-muted">{r.order_number}</p>
                  </td>
                  <td className={`${td} font-semibold text-lobeans-ink`}>{r.supplier_name}</td>
                  <td className={`${td} text-right font-bold tabular-nums text-emerald-700`}>+{num(r.total_qty)} kg</td>
                  <td className={`${td} text-right`}>
                    <Link href={`/transactions/new?type=IN&inspection_id=${r.inspection_id}`} className="font-bold text-[#284c35] hover:underline">
                      Catat Barang Masuk →
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        )}
        <Card title="Antrean Pemeriksaan Barang Tiba" subtitle="Periksa seluruh item secara utuh dan lampirkan foto bukti pemeriksaan." action={more('/inspections')}>
          <DataTable
            head={[
              { label: 'Pengiriman & Pesanan' },
              { label: 'Supplier' },
              { label: 'Berat', align: 'right' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={inspQueue.length === 0}
            emptyText="Belum ada instruksi pemeriksaan baru dari Manager."
          >
            {inspQueue.map((r) => (
              <tr key={r.shipment_id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{r.shipment_number}</p>
                  <p className="text-[11px] text-lobeans-muted">
                    {r.order_number} · Percobaan #{r.attempt_number}
                  </p>
                </td>
                <td className={`${td} font-semibold text-lobeans-ink`}>{r.supplier_name}</td>
                <td className={`${td} text-right font-bold tabular-nums`}>{num(r.total_qty)} kg</td>
                <td className={`${td} text-right`}>
                  <Link href={`/inspections/${r.shipment_id}`} className="font-bold text-[#284c35] hover:underline">
                    Periksa Sekarang →
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        <Card title="Transaksi Barang Keluar (OUT) Aktif" subtitle="Transaksi OUT yang sudah disetujui siap dikirim dan diperbarui ke status Shipped." action={more('/transactions/out')}>
          <DataTable
            head={[
              { label: 'No. Transaksi' },
              { label: 'Penerima & Tujuan' },
              { label: 'Berat', align: 'right' },
              { label: 'Status' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={outQueue.length === 0}
            emptyText="Tidak ada transaksi Barang Keluar yang menunggu pengiriman."
          >
            {outQueue.map((t) => (
              <tr key={t.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{t.trx_number}</p>
                  <p className="text-[11px] text-lobeans-muted">{fmtDate(t.trx_date)}</p>
                </td>
                <td className={td}>
                  <p className="font-bold text-lobeans-ink">{t.recipient_name}</p>
                  <p className="text-[11px] text-lobeans-muted">{t.destination}</p>
                </td>
                <td className={`${td} text-right font-bold tabular-nums`}>-{num(t.total_qty)} kg</td>
                <td className={td}>
                  <StatusBadge status={t.status} />
                </td>
                <td className={`${td} text-right`}>
                  <Link href={`/transactions/${t.id}`} className="font-bold text-[#284c35] hover:underline">
                    {t.status === 'approved' ? 'Kirim (Shipped) →' : 'Detail →'}
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>
    </>
  );
}

/* ═══════════════════════════ 4. SUPPLIER ═══════════════════════════ */

async function SupplierDashboard({ user }) {
  const [orders, returnAlerts] = await Promise.all([
    many(
      `SELECT so.*,
              COALESCE((SELECT SUM(quantity) FROM supply_order_items WHERE supply_order_id = so.id),0)::numeric AS total_qty,
              (SELECT sh.status FROM shipments sh WHERE sh.supply_order_id = so.id ORDER BY sh.attempt_number DESC LIMIT 1) AS latest_shipment_status,
              (SELECT sh.attempt_number FROM shipments sh WHERE sh.supply_order_id = so.id ORDER BY sh.attempt_number DESC LIMIT 1) AS attempt_number
         FROM supply_orders so
        WHERE so.supplier_id = $1
        ORDER BY CASE so.status WHEN 'pending' THEN 0 WHEN 'confirmed' THEN 1 ELSE 2 END, so.created_at DESC`,
      [user.supplier_id],
    ),
    many(
      `SELECT sh.id, sh.shipment_number, sh.status, sh.supply_order_id, so.order_number,
              rt.reason, rt.instructions
         FROM shipments sh
         JOIN supply_orders so ON so.id = sh.supply_order_id
         LEFT JOIN returns rt ON rt.shipment_id = sh.id
        WHERE so.supplier_id = $1 AND sh.status = 'returned'
        ORDER BY sh.updated_at DESC`,
      [user.supplier_id],
    ),
  ]);

  const pending = orders.filter((o) => o.status === 'pending').length;
  const active = orders.filter((o) => ['confirmed', 'in_transit', 'arrived', 'inspecting'].includes(o.status)).length;
  const completed = orders.filter((o) => o.status === 'received').length;
  const totalCompletedKg = orders
    .filter((o) => o.status === 'received')
    .reduce((a, o) => a + Number(o.total_qty), 0);

  return (
    <>
      <HeroDashboard
        roleTag="Portal Supplier"
        greeting={`Selamat datang, ${user.company_name || user.name}.`}
        subtitle="Tinjau Restock Order (PO) dari Gudang Pusat LOBEANS, konfirmasi ketersediaan, kirim barang (In Transit), dan serahkan bukti kedatangan."
        ctaLabel="Pengiriman Barang"
        ctaHref="/shipments"
        secondaryLabel={pending > 0 ? `${pending} PO perlu konfirmasi →` : 'Lihat permintaan pasokan →'}
        secondaryHref={pending > 0 ? '/supply-orders?status=pending' : '/supply-orders'}
        contextTitle={user.supplier_code || 'Mitra Terverifikasi'}
        contextNote={user.name}
      />

      <SectionTitle title="Ringkasan Pasokan Anda" subtitle="Status Restock Order (PO) dan pengiriman dari Gudang LOBEANS." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Perlu Konfirmasi" value={num(pending)} note="PO baru dari Manager" href="/supply-orders?status=pending" />
        <MetricCard label="Sedang Diproses" value={num(active)} note="Confirmed / In Transit / Inspecting" href="/shipments" />
        <MetricCard label="Diterima (Received)" value={num(completed)} note="Stok sudah diterima gudang" href="/supply-orders?status=received" />
        <MetricCard label="Total Pasokan Diterima" value={`${num(totalCompletedKg)} kg`} note="Akumulasi PO Received" />
      </div>

      {returnAlerts.length > 0 && (
        <div className="mt-7">
          <Card
            title={`Pemberitahuan Retur & Klaim Refund (${returnAlerts.length})`}
            subtitle="Pesanan berikut ditolak penerimaan oleh Manager Gudang (Returned). Silakan tindak lanjuti klaim refund sesuai catatan."
            className="border-red-300/80"
          >
            <DataTable
              head={[
                { label: 'Pengiriman & Pesanan' },
                { label: 'Alasan Retur' },
                { label: 'Status' },
                { label: 'Aksi', align: 'right' },
              ]}
            >
              {returnAlerts.map((rt) => (
                <tr key={rt.id} className="bg-red-50/25 hover:bg-red-50/50">
                  <td className={td}>
                    <p className="font-mono font-bold text-lobeans-ink">{rt.shipment_number}</p>
                    <p className="text-[11px] text-lobeans-muted">{rt.order_number}</p>
                  </td>
                  <td className={td}>
                    <p className="font-semibold text-red-900">{rt.reason || 'Ketidaksesuaian pemeriksaan'}</p>
                    {rt.instructions && <p className="text-[11px] text-lobeans-muted">{rt.instructions}</p>}
                  </td>
                  <td className={td}>
                    <StatusBadge status={rt.status} />
                  </td>
                  <td className={`${td} text-right`}>
                    <Link href={`/supply-orders/${rt.supply_order_id}`} className="font-bold text-red-700 hover:underline">
                      {rt.status === 'returned' ? 'Kirim Pengganti →' : 'Detail Retur →'}
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <Card
          title="Daftar Permintaan Pasokan dari Gudang"
          subtitle="Klik pesanan untuk mengonfirmasi ketersediaan, memproses pengiriman, atau memantau pemeriksaan."
          action={more('/supply-orders')}
        >
          <DataTable
            head={[
              { label: 'No. Pesanan' },
              { label: 'Target Tiba', hide: 'sm' },
              { label: 'Berat', align: 'right' },
              { label: 'Status Pesanan' },
              { label: 'Status Pengiriman', hide: 'md' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={orders.length === 0}
            emptyText="Belum ada permintaan pasokan dari Gudang Pusat LOBEANS."
          >
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{o.order_number}</p>
                  <p className="max-w-xs truncate text-[11px] text-lobeans-muted">{o.notes}</p>
                </td>
                <td className={`${td} ${hideCls('sm')} text-lobeans-muted`}>{fmtDate(o.expected_date)}</td>
                <td className={`${td} text-right font-bold tabular-nums`}>{num(o.total_qty)} kg</td>
                <td className={td}>
                  <StatusBadge status={o.status} />
                </td>
                <td className={`${td} ${hideCls('md')}`}>
                  {o.latest_shipment_status ? (
                    <StatusBadge status={o.latest_shipment_status} />
                  ) : (
                    <span className="text-lobeans-muted">—</span>
                  )}
                </td>
                <td className={`${td} text-right`}>
                  <Link href={`/supply-orders/${o.id}`} className="font-bold text-[#284c35] hover:underline">
                    {o.status === 'pending' ? 'Konfirmasi →' : 'Kelola →'}
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>
    </>
  );
}

export default async function DashboardPage({ searchParams }) {
  const user = await requireUser();
  const sp = await searchParams;

  return (
    <>
      <Flash ok={sp?.ok} err={sp?.err} />
      {user.role === 'admin' && <AdminDashboard user={user} />}
      {user.role === 'manager' && <ManagerDashboard user={user} />}
      {user.role === 'staff' && <StaffDashboard user={user} />}
      {user.role === 'supplier' && <SupplierDashboard user={user} />}
    </>
  );
}
