import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { one } from '@/lib/db.js';
import { updateCategoryAction } from '@/app/actions/categories.js';
import { CategoryForm } from '@/components/CategoryForm.js';
import { Card, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Ubah Kategori' };

export default async function EditCategoryPage({ params }) {
  await requireUser(['admin', 'manager']);
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const cat = await one('SELECT * FROM categories WHERE id = $1', [numId]);
  if (!cat) notFound();

  const action = updateCategoryAction.bind(null, cat.id);
  return (
    <>
      <PageHeader eyebrow="Kategori Kopi" title={`Ubah ${cat.name}`} subtitle="Perbarui nama dan keterangan kategori." />
      <Card padded className="max-w-2xl">
        <CategoryForm action={action} initial={cat} isEdit />
      </Card>
    </>
  );
}
