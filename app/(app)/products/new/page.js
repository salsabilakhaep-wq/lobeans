import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { createProductAction } from '@/app/actions/products.js';
import { ProductForm } from '@/components/ProductForm.js';
import { Card, LinkButton, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Tambah Produk' };

export default async function NewProductPage() {
  await requireUser(['admin', 'manager']);
  const categories = await many('SELECT id, name FROM categories WHERE is_active = TRUE ORDER BY id');
  return (
    <>
      <PageHeader
        eyebrow="Katalog Produk"
        title="Tambah Produk Green Bean"
        subtitle="Tambahkan produk baru ke gudang beserta batas stok minimum dan lokasi penyimpanan."
        action={
          <LinkButton href="/products" variant="secondary">
            ← Daftar Produk
          </LinkButton>
        }
      />
      <Card padded className="max-w-3xl">
        <ProductForm action={createProductAction} categories={categories} />
      </Card>
    </>
  );
}
