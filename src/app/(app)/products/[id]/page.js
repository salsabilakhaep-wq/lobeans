import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { many, one } from '@/lib/db.js';
import { fmtDateTime, num, rupiah } from '@/lib/format.js';
import { SkuBarcode } from '@/components/SkuBarcode.js';
import { Card, DataTable, LinkButton, PageHeader, StatusBadge, StockBadge, td } from '@/components/ui.js';

export const metadata = { title: 'Detail Produk' };

export default async function ProductDetailPage({ params }) {
  const user = await requireUser(['admin', 'manager', 'staff']);
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) notFound();

  const [product, history] = await Promise.all([
    one('SELECT * FROM v_products WHERE id = $1', [numId]),
    many(
      `SELECT t.id AS trx_id, t.trx_number, t.type, t.trx_date, t.status, t.recipient_name,
              ti.quantity, u.name AS creator_name, so.order_number,
              COALESCE(s1.company_name, s2.company_name) AS supplier_name,
              t.created_at
         FROM inventory_transaction_items ti
         JOIN inventory_transactions t ON t.id = ti.transaction_id
         JOIN users u ON u.id = t.created_by
         LEFT JOIN supply_orders so ON so.id = t.supply_order_id
         LEFT JOIN suppliers s1 ON s1.id = t.supplier_id
         LEFT JOIN suppliers s2 ON s2.id = so.supplier_id
        WHERE ti.product_id = $1
        ORDER BY t.created_at DESC
        LIMIT 5`,
      [numId],
    ),
  ]);

  if (!product) notFound();

  const canManage = ['admin', 'manager'].includes(user.role);
  const canOrderSupply = user.role === 'manager';

  return (
    <>
      <PageHeader
        eyebrow={`${product.category_name} · ${product.sku}`}
        title={product.name}
        subtitle={`${product.variety} · ${product.process_method} · ${product.origin_region}`}
        action={
          <>
            <LinkButton href="/products" variant="secondary">
              ← Daftar Produk
            </LinkButton>
            {canManage && (
              <LinkButton href={`/products/${product.id}/edit`} variant="secondary">
                Ubah Produk
              </LinkButton>
            )}
            {canOrderSupply && (
              <LinkButton href={`/supply-orders/new?product_id=${product.id}`} icon="plus">
                Buat Permintaan Pasokan
              </LinkButton>
            )}
          </>
        }
      />

      <div className="space-y-6">
        <Card
          title="Ringkasan Stok & Informasi Produk"
          subtitle={`Lokasi penyimpanan: ${product.rack_location}`}
          action={<StockBadge status={product.stock_status} />}
          padded
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-[12px] border border-[#e6e5de] bg-[#faf9f5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image_url || '/product-placeholder.svg'}
                alt={product.name}
                className="h-52 w-full object-cover"
              />
            </div>

            <dl className="grid grid-cols-2 gap-4 text-[12.5px] lg:col-span-2 sm:grid-cols-3">
              <div>
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">SKU</dt>
                <dd className="mt-1 font-mono font-bold text-lobeans-ink">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Stok Saat Ini</dt>
                <dd className="mt-1 text-[18px] font-bold text-lobeans-ink tabular-nums">
                  {num(product.stock)} <span className="text-[12px] font-medium text-lobeans-muted">{product.unit}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Batas Min / Low</dt>
                <dd className="mt-1 font-bold text-lobeans-ink tabular-nums">
                  {num(product.min_stock)} / {num(product.low_stock)} {product.unit}
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Harga Beli</dt>
                <dd className="mt-1 font-bold text-lobeans-ink tabular-nums">{rupiah(product.buy_price)}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Harga Jual</dt>
                <dd className="mt-1 font-bold text-lobeans-ink tabular-nums">{rupiah(product.sell_price)}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Lokasi Rak / Silo</dt>
                <dd className="mt-1 font-mono font-bold text-lobeans-ink">{product.rack_location}</dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-[10.5px] font-bold uppercase tracking-wider text-lobeans-muted">Deskripsi &amp; Mutu</dt>
                <dd className="mt-1 leading-relaxed text-lobeans-ink">{product.description}</dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card title="Label Barcode SKU" subtitle="Gunakan label ini untuk identifikasi karung dan rak penyimpanan." padded>
          <SkuBarcode sku={product.sku} name={product.name} rackLocation={product.rack_location} />
        </Card>

        <Card
          title="Riwayat 5 Transaksi Terakhir"
          subtitle="Pergerakan barang masuk dan barang keluar terbaru untuk produk ini."
        >
          <DataTable
            head={[
              { label: 'No. Transaksi' },
              { label: 'Tipe' },
              { label: 'Sumber / Penerima' },
              { label: 'Kuantitas', align: 'right' },
              { label: 'Status' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={history.length === 0}
            emptyText="Belum ada riwayat transaksi untuk produk ini."
          >
            {history.map((h) => (
              <tr key={`${h.trx_id}-${h.type}`} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-mono font-bold text-lobeans-ink">{h.trx_number}</p>
                  <p className="text-[11px] text-lobeans-muted">{fmtDateTime(h.created_at)}</p>
                </td>
                <td className={td}>
                  <StatusBadge status={h.type} />
                </td>
                <td className={`${td} font-semibold text-lobeans-ink`}>
                  {h.type === 'IN' ? h.supplier_name || h.order_number || 'Penerimaan Gudang' : h.recipient_name}
                </td>
                <td className={`${td} text-right font-bold tabular-nums ${h.type === 'IN' ? 'text-emerald-700' : 'text-amber-900'}`}>
                  {h.type === 'IN' ? '+' : '-'}
                  {num(h.quantity)} {product.unit}
                </td>
                <td className={td}>
                  <StatusBadge status={h.status} />
                </td>
                <td className={`${td} text-right`}>
                  <Link href={`/transactions/${h.trx_id}`} className="font-bold text-lobeans-forest hover:underline">
                    Detail →
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
