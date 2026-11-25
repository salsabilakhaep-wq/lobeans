import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { many, one } from '@/lib/db.js';
import { num } from '@/lib/format.js';
import { updateProductAction } from '@/app/actions/products.js';
import { ProductForm } from '@/components/ProductForm.js';
import { Card, LinkButton, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Ubah Produk' };

export default async function EditProductPage({ params }) {
  await requireUser(['admin', 'manager']);
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const [product, categories] = await Promise.all([
    one('SELECT * FROM products WHERE id = $1', [numId]),
    many('SELECT id, name FROM categories WHERE is_active = TRUE ORDER BY id'),
  ]);
  if (!product) notFound();

  const action = updateProductAction.bind(null, product.id);
  return (
    <>
      <PageHeader
        eyebrow="Katalog Produk"
        title={`Ubah ${product.name}`}
        subtitle={`SKU ${product.sku} · Saldo stok saat ini ${num(product.stock)} ${product.unit}.`}
        action={
          <LinkButton href={`/products/${product.id}`} variant="secondary">
            ← Detail Produk
          </LinkButton>
        }
      />
      <Card padded className="max-w-3xl">
        <ProductForm action={action} categories={categories} initial={product} isEdit />
      </Card>
    </>
  );
}
