import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { one } from '@/lib/db.js';
import { parsePositiveInt } from '@/lib/form.js';
import { updateSupplierAction } from '@/app/actions/suppliers.js';
import { SupplierForm } from '@/components/SupplierForm.js';
import { Card, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Ubah Supplier' };

export default async function EditSupplierPage({ params }) {
  await requireUser(['admin']);
  const { id } = await params;
  const numId = parsePositiveInt(id);
  if (!numId) notFound();

  const supplier = await one('SELECT * FROM suppliers WHERE id = $1', [numId]);
  if (!supplier) notFound();

  const action = updateSupplierAction.bind(null, supplier.id);
  return (
    <>
      <PageHeader eyebrow="Profil Supplier" title={`Ubah ${supplier.company_name}`} subtitle={`Kode ${supplier.supplier_code}`} />
      <Card padded className="max-w-3xl">
        <SupplierForm action={action} initial={supplier} isEdit />
      </Card>
    </>
  );
}
