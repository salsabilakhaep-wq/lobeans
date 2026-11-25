import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { createUserAction } from '@/app/actions/users.js';
import { UserForm } from '@/components/UserForm.js';
import { Card, LinkButton, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Tambah Pengguna' };

export default async function NewUserPage({ searchParams }) {
  await requireUser(['admin']);
  const sp = await searchParams;
  const requestedRole = ['staff', 'manager', 'supplier'].includes(sp?.role) ? sp.role : 'staff';

  const unlinkedSuppliers = await many(
    `SELECT s.id, s.supplier_code, s.company_name
       FROM suppliers s
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.supplier_id = s.id)
      ORDER BY s.id ASC`,
  );

  return (
    <>
      <PageHeader
        eyebrow="Administrasi Akun"
        title="Tambah Pengguna Baru"
        subtitle="Buat akun baru untuk Staff Gudang, Manager Gudang, atau mitra Supplier lengkap dengan enkripsi kata sandi."
        action={
          <LinkButton href="/users" variant="secondary">
            ← Daftar Akun
          </LinkButton>
        }
      />

      <Card title="Formulir Akun Pengguna" subtitle="Pilih role Staff Gudang, Manager Gudang, atau Supplier." padded>
        <UserForm action={createUserAction} suppliers={unlinkedSuppliers} defaultRole={requestedRole} />
      </Card>
    </>
  );
}
