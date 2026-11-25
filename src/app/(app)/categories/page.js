import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { num, rupiah } from '@/lib/format.js';
import { toggleCategoryActiveAction } from '@/app/actions/categories.js';
import { ActionButton } from '@/components/ActionForm.js';
import { buttonClass } from '@/components/styles.js';
import { Flash, LinkButton, PageHeader, StatusBadge } from '@/components/ui.js';

export const metadata = { title: 'Kategori Kopi' };

const FALLBACK_IMG = {
  arabika: '/cat-arabika.svg',
  robusta: '/cat-robusta.svg',
  liberika: '/cat-liberika.svg',
  excelsa: '/cat-excelsa.svg',
};

export default async function CategoriesPage({ searchParams }) {
  await requireUser(['admin', 'manager']);
  const sp = await searchParams;

  const categories = await many(
    `SELECT c.*, COUNT(p.id)::int AS product_count,
            COALESCE(SUM(p.stock),0)::numeric AS total_stock,
            COALESCE(SUM(p.stock * p.buy_price),0)::numeric AS stock_value
       FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
      GROUP BY c.id ORDER BY c.id ASC`,
  );

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow="Master Data Kategori"
        title="Kategori Kopi"
        subtitle="Kelola kategori produk green bean LOBEANS. Kategori yang masih memiliki stok atau produk aktif tidak dapat dihapus."
        action={
          <>
            <LinkButton href="/products" variant="secondary">
              ← Kelola Produk
            </LinkButton>
            <LinkButton href="/categories/new" icon="plus">
              Tambah Kategori
            </LinkButton>
          </>
        }
      />

      {categories.length === 0 ? (
        <div className="rounded-[16px] border border-[#e5e4dc] bg-white px-6 py-14 text-center text-[13px] font-medium text-lobeans-muted">
          Belum ada kategori produk.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {categories.map((c) => {
            const imgSrc = c.image_url || FALLBACK_IMG[c.name.toLowerCase()] || '/product-placeholder.svg';
            return (
              <article
                key={c.id}
                className={`flex flex-col overflow-hidden rounded-[16px] border border-[#e5e4dc] bg-white transition-all hover:border-lobeans-forest/35 hover:shadow-sm ${
                  !c.is_active ? 'opacity-60' : ''
                }`}
              >
                {/* Gambar Kategori Besar & Jelas (2 card per baris) */}
                <Link href={`/products?category=${c.id}`} className="relative block h-52 w-full overflow-hidden bg-[#13291f]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                  />
                  <div className="absolute right-3.5 top-3.5">
                    <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <Link
                      href={`/products?category=${c.id}`}
                      className="text-[19px] font-bold tracking-tight text-lobeans-ink hover:text-lobeans-forest hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#526257]">{c.description}</p>

                    <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-[12px] border border-[#eeede6] bg-[#faf9f5] p-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-lobeans-muted">Produk</p>
                        <p className="mt-0.5 text-[16px] font-bold text-lobeans-ink tabular-nums">{c.product_count}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-lobeans-muted">Total Stok</p>
                        <p className="mt-0.5 text-[16px] font-bold text-lobeans-ink tabular-nums">
                          {num(c.total_stock)} <span className="text-[11px] font-medium text-lobeans-muted">kg</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-lobeans-muted">Nilai Aset</p>
                        <p className="mt-1 text-[12.5px] font-bold text-lobeans-ink tabular-nums">{rupiah(c.stock_value)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eeede6] pt-3.5">
                    <Link href={`/products?category=${c.id}`} className="text-[12.5px] font-bold text-lobeans-forest hover:underline">
                      Lihat Produk ({c.product_count}) →
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href={`/categories/${c.id}/edit`} className={buttonClass('secondary', 'sm')}>
                        Ubah
                      </Link>
                      <ActionButton
                        action={toggleCategoryActiveAction}
                        values={{ id: c.id, next_active: c.is_active ? 'false' : 'true' }}
                        variant={c.is_active ? 'danger' : 'success'}
                        alertTitle="Kategori Tidak Dapat Dihapus"
                        alertOnError
                        blockedMessage={
                          c.is_active && Number(c.total_stock) > 0
                            ? `Kategori "${c.name}" tidak dapat dihapus karena masih memiliki stok tersisa sebesar ${num(c.total_stock)} kg (${c.product_count} produk aktif). Habiskan stok dan nonaktifkan produk terlebih dahulu.`
                            : c.is_active && Number(c.product_count) > 0
                              ? `Kategori "${c.name}" tidak dapat dihapus karena masih memiliki ${c.product_count} produk aktif di dalamnya.`
                              : undefined
                        }
                        confirm={
                          c.is_active && Number(c.total_stock) === 0 && Number(c.product_count) === 0
                            ? `Yakin ingin menghapus kategori "${c.name}"?`
                            : undefined
                        }
                      >
                        {c.is_active ? 'Hapus' : 'Aktifkan'}
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
