import { requireUser } from '@/lib/auth.js';
import { createCategoryAction } from '@/app/actions/categories.js';
import { CategoryForm } from '@/components/CategoryForm.js';
import { Card, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Tambah Kategori' };

export default async function NewCategoryPage() {
  await requireUser(['admin', 'manager']);
  return (
    <>
      <PageHeader eyebrow="Kategori kopi" title="Tambah kategori" subtitle="Tambahkan klasifikasi kopi baru ke master data LOBEANS." />
      <Card padded className="max-w-2xl">
        <CategoryForm action={createCategoryAction} />
      </Card>
    </>
  );
}
