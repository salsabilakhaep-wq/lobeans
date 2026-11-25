import Link from 'next/link';
import { APP_CONFIG } from '@/lib/appConfig.js';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { num, rupiah } from '@/lib/format.js';
import { toggleProductActiveAction } from '@/app/actions/products.js';
import { ActionButton } from '@/components/ActionForm.js';
import { buttonClass, inputCls } from '@/components/styles.js';
import { Flash, LinkButton, PageHeader, StatusBadge, StockBadge } from '@/components/ui.js';

export const metadata = { title: 'Kelola Produk' };

const PER_PAGE = APP_CONFIG.pagination.productsPerPage;

export default async function ProductsPage({ searchParams }) {
  const user = await requireUser(['admin', 'manager', 'staff']);
  const sp = await searchParams;
  const q = (sp.q || '').trim().toLowerCase();
  const cat = sp.category ? Number(sp.category) : null;
  const status = sp.status || '';
  const sort = sp.sort || 'name';
  const page = Math.max(1, Number(sp.page) || 1);
  const canManage = ['admin', 'manager'].includes(user.role);
  const isManager = user.role === 'manager';

  const [products, categories] = await Promise.all([
    many('SELECT * FROM v_products ORDER BY is_active DESC, name ASC'),
    many('SELECT id, name FROM categories WHERE is_active = TRUE ORDER BY id'),
  ]);

  const lowStockCount = products.filter((p) => p.is_active && p.stock_status !== 'normal').length;

  let filtered = products.filter((p) => {
    if (!canManage && !p.is_active) return false;
    if (cat && Number(p.category_id) !== cat) return false;
    if (status === 'alert' && p.stock_status === 'normal') return false;
    if (status && status !== 'alert' && p.stock_status !== status) return false;
    if (q && !`${p.sku} ${p.name} ${p.variety} ${p.origin_region}`.toLowerCase().includes(q)) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    if (sort === 'stock_asc') return Number(a.stock) - Number(b.stock);
    if (sort === 'stock_desc') return Number(b.stock) - Number(a.stock);
    if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const pageHref = (target) => {
    const params = new URLSearchParams();
    if (sp.q) params.set('q', sp.q);
    if (sp.category) params.set('category', sp.category);
    if (status) params.set('status', status);
    if (sort && sort !== 'name') params.set('sort', sort);
    if (target > 1) params.set('page', String(target));
    const qs = params.toString();
    return qs ? `/products?${qs}` : '/products';
  };

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow="Katalog Persediaan"
        title={canManage ? 'Kelola Produk Green Bean' : 'Stok Produk Green Bean'}
        subtitle="Pantau ketersediaan stok, lokasi rak, harga, dan status peringatan otomatis setiap jenis kopi."
        action={
          <>
            {canManage && (
              <LinkButton href="/categories" variant="secondary">
                Kategori ({categories.length})
              </LinkButton>
            )}
            {canManage && (
              <LinkButton href="/products/new" icon="plus">
                Tambah Produk
              </LinkButton>
            )}
          </>
        }
      />

      {isManager && lowStockCount > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-amber-300/80 bg-amber-50/80 px-4 py-3.5 text-[12.5px] text-amber-950">
          <div>
            <p className="font-bold">
              Perhatian: {lowStockCount} produk aktif sedang memiliki stok menipis (Low / Severe / Out of Stock).
            </p>
            <p className="mt-0.5 text-[11.5px] text-amber-900/80">
              Klik tombol <strong>+ Permintaan PO</strong> pada kartu produk untuk langsung mengajukan restock ke Supplier.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status !== 'alert' && (
              <Link href="/products?status=alert" className={buttonClass('secondary', 'sm')}>
                Filter Stok Menipis ({lowStockCount})
              </Link>
            )}
            <LinkButton href="/supply-orders/new" size="sm" variant="primary" icon="plus">
              Buat Permintaan PO
            </LinkButton>
          </div>
        </div>
      )}

      <form method="GET" className="mb-6 grid grid-cols-1 gap-3 rounded-[14px] border border-[#e5e4dc] bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input name="q" defaultValue={sp.q || ''} placeholder="Cari nama produk atau SKU…" className={inputCls} />
        <select name="category" defaultValue={sp.category || ''} className={inputCls}>
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} className={inputCls}>
          <option value="">Semua status stok</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
          <option value="severe">Severe</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="alert">Perlu Perhatian</option>
        </select>
        <select name="sort" defaultValue={sort} className={inputCls}>
          <option value="name">Urutkan: Nama (A-Z)</option>
          <option value="stock_asc">Stok Terendah</option>
          <option value="stock_desc">Stok Tertinggi</option>
          <option value="newest">Terbaru Ditambahkan</option>
        </select>
        <button type="submit" className={buttonClass('dark', 'md')}>
          Terapkan Filter
        </button>
      </form>

      {paged.length === 0 ? (
        <div className="rounded-[16px] border border-[#e5e4dc] bg-white px-6 py-14 text-center text-[13px] font-medium text-lobeans-muted">
          Tidak ada produk yang cocok dengan filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {paged.map((p) => (
            <article
              key={p.id}
              className={`flex flex-col overflow-hidden rounded-[16px] border bg-white transition-all hover:border-lobeans-forest/35 hover:shadow-sm ${
                p.is_active && p.stock_status !== 'normal' ? 'border-amber-300/85' : 'border-[#e5e4dc]'
              } ${!p.is_active ? 'opacity-60' : ''}`}
            >
              {/* Gambar Produk Besar & Jelas (2 card per baris) */}
              <Link href={`/products/${p.id}`} className="relative block h-56 w-full overflow-hidden bg-[#13291f]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image_url || '/product-placeholder.svg'}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                />
                <span className="absolute left-3.5 top-3.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                  {p.category_name}
                </span>
                <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
                  {!p.is_active && <StatusBadge status="inactive" label="Nonaktif" />}
                  <StockBadge status={p.stock_status} />
                </div>
              </Link>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/products/${p.id}`}
                        className="text-[17px] font-bold leading-snug tracking-tight text-lobeans-ink hover:text-lobeans-forest hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="mt-1 font-mono text-[11.5px] font-semibold text-lobeans-muted">
                        {p.sku} · {p.variety} · {p.process_method}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-[#526257]">{p.description}</p>

                  {/* Ringkasan Stok, Lokasi & Harga */}
                  <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-[12px] border border-[#eeede6] bg-[#faf9f5] p-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-lobeans-muted">Stok</p>
                      <p className="mt-0.5 text-[16px] font-bold text-lobeans-ink tabular-nums">
                        {num(p.stock)} <span className="text-[11px] font-medium text-lobeans-muted">{p.unit}</span>
                      </p>
                      <p className="text-[10px] text-lobeans-muted">
                        min {num(p.min_stock)} / low {num(p.low_stock)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-lobeans-muted">Lokasi Rak</p>
                      <p className="mt-1 font-mono text-[13px] font-bold text-lobeans-ink">{p.rack_location}</p>
                      <p className="text-[10px] text-lobeans-muted">{p.origin_region}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-lobeans-muted">Harga Beli</p>
                      <p className="mt-1 text-[13px] font-bold text-lobeans-ink tabular-nums">{rupiah(p.buy_price)}</p>
                      <p className="text-[10px] text-lobeans-muted">Jual {rupiah(p.sell_price)}</p>
                    </div>
                  </div>
                </div>

                {/* Baris Aksi */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eeede6] pt-3.5">
                  <Link href={`/products/${p.id}`} className="text-[12.5px] font-bold text-lobeans-forest hover:underline">
                    Detail &amp; Barcode →
                  </Link>
                  {canManage && (
                    <div className="flex flex-wrap items-center gap-2">
                      {isManager && p.stock_status !== 'normal' && p.is_active && (
                        <LinkButton href={`/supply-orders/new?product_id=${p.id}`} size="sm" variant="primary" icon="plus">
                          Permintaan PO
                        </LinkButton>
                      )}
                      <Link href={`/products/${p.id}/edit`} className={buttonClass('secondary', 'sm')}>
                        Ubah
                      </Link>
                      <ActionButton
                        action={toggleProductActiveAction}
                        values={{ id: p.id, next_active: p.is_active ? 'false' : 'true' }}
                        variant={p.is_active ? 'danger' : 'success'}
                        alertTitle="Produk Tidak Dapat Dihapus"
                        alertOnError
                        blockedMessage={
                          p.is_active && Number(p.stock) > 0
                            ? `Produk "${p.name}" tidak dapat dihapus karena masih memiliki stok tersisa sebesar ${num(p.stock)} ${p.unit}. Habiskan stok terlebih dahulu sebelum menghapus produk.`
                            : undefined
                        }
                        confirm={
                          p.is_active && Number(p.stock) === 0
                            ? `Yakin ingin menghapus produk "${p.name}"?`
                            : undefined
                        }
                      >
                        {p.is_active ? 'Hapus' : 'Aktifkan'}
                      </ActionButton>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-[14px] border border-[#e5e4dc] bg-white px-5 py-3.5 text-[12px]">
          <span className="text-lobeans-muted">
            Menampilkan halaman <strong className="text-lobeans-ink">{safePage}</strong> dari {totalPages} ({filtered.length} produk)
          </span>
          <div className="flex items-center gap-2">
            {safePage > 1 && (
              <Link href={pageHref(safePage - 1)} className={buttonClass('secondary', 'sm')}>
                ← Sebelumnya
              </Link>
            )}
            {safePage < totalPages && (
              <Link href={pageHref(safePage + 1)} className={buttonClass('secondary', 'sm')}>
                Berikutnya →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
