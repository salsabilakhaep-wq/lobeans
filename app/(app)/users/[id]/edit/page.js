import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { one } from '@/lib/db.js';
import { updateUserAction } from '@/app/actions/users.js';
import { UserForm } from '@/components/UserForm.js';
import { Card, PageHeader } from '@/components/ui.js';

export const metadata = { title: 'Ubah Pengguna' };

export default async function EditUserPage({ params }) {
  await requireUser(['admin']);
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const user = await one(
    `SELECT u.id, u.name, u.email, u.is_active, r.code AS role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
    [numId],
  );
  if (!user) notFound();

  const action = updateUserAction.bind(null, user.id);

  return (
    <>
      <PageHeader eyebrow="Pengguna & Role" title={`Ubah Akun ${user.name}`} subtitle="Perbarui identitas, role, status aktif, atau kata sandi." />
      <Card padded className="max-w-2xl">
        <UserForm action={action} initial={user} isEdit />
      </Card>
    </>
  );
}
