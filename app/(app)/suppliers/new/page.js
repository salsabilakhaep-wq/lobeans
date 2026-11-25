import { requireUser } from '@/lib/auth.js';
import { createSupplierAction } from '@/app/actions/suppliers.js';
import { SupplierForm } from '@/components/SupplierForm.js';
import { Card, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Tambah Supplier' };

export default async function NewSupplierPage() {
  await requireUser(['admin']);
  return (
    <>
      <PageHeader eyebrow="Profil Supplier" title="Tambah Profil Supplier" subtitle="Tambahkan mitra petani, kelompok tani, atau koperasi pemasok kopi." />
      <Card padded className="max-w-3xl">
        <SupplierForm action={createSupplierAction} />
      </Card>
    </>
  );
}
