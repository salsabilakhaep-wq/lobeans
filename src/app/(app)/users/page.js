import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { fmtDate } from '@/lib/format.js';
import { toggleUserActiveAction } from '@/app/actions/users.js';
import { ActionButton } from '@/components/ActionForm.js';
import { Card, DataTable, FilterPills, Flash, LinkButton, PageHeader, StatusBadge, hideCls, td } from '@/components/ui.js';

export const metadata = { title: 'Pengguna & Role' };

export default async function UsersPage({ searchParams }) {
  const me = await requireUser(['admin']);
  const sp = await searchParams;
  const roleFilter = sp.role || '';

  const all = await many(
    `SELECT u.id, u.name, u.email, u.is_active, u.created_at,
            r.code AS role, r.name AS role_name,
            s.company_name, s.supplier_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN suppliers s ON s.id = u.supplier_id
      ORDER BY u.id ASC`,
  );

  const users = roleFilter ? all.filter((u) => u.role === roleFilter) : all;

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow="Administrasi Akun"
        title="Daftar Akun & Role"
        subtitle="Akun Admin, Manager Gudang, dan Staff Gudang disiapkan melalui data awal sistem; akun Supplier mendaftar mandiri melalui halaman registrasi dan diverifikasi Admin."
        action={
          <LinkButton href="/suppliers" variant="secondary">
            Verifikasi Supplier →
          </LinkButton>
        }
      />

      <FilterPills
        basePath="/users"
        param="role"
        active={roleFilter}
        items={[
          ['', 'Semua Role', all.length],
          ['admin', 'Admin', all.filter((u) => u.role === 'admin').length],
          ['manager', 'Manager Gudang', all.filter((u) => u.role === 'manager').length],
          ['staff', 'Staff Gudang', all.filter((u) => u.role === 'staff').length],
          ['supplier', 'Supplier', all.filter((u) => u.role === 'supplier').length],
        ]}
      />

      <Card title={`Daftar Akun (${users.length})`}>
        <DataTable
          head={[
            { label: 'Nama & Email' },
            { label: 'Role' },
            { label: 'Profil Supplier', hide: 'md' },
            { label: 'Dibuat', hide: 'lg' },
            { label: 'Status' },
            { label: 'Aksi', align: 'right' },
          ]}
          empty={users.length === 0}
        >
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-[#faf9f5]">
              <td className={td}>
                <p className="font-bold text-lobeans-ink">{u.name}</p>
                <p className="text-[11px] text-lobeans-muted">{u.email}</p>
              </td>
              <td className={`${td} font-semibold text-[#35463b]`}>{u.role_name}</td>
              <td className={`${td} ${hideCls('md')} text-lobeans-muted`}>
                {u.company_name ? (
                  <>
                    <p className="font-semibold text-lobeans-ink">{u.company_name}</p>
                    <p className="font-mono text-[10.5px]">{u.supplier_code}</p>
                  </>
                ) : (
                  'Internal Gudang'
                )}
              </td>
              <td className={`${td} ${hideCls('lg')} text-[11.5px] text-lobeans-muted`}>{fmtDate(u.created_at)}</td>
              <td className={td}>
                <StatusBadge status={u.is_active ? 'active' : 'inactive'} />
              </td>
              <td className={`${td} text-right`}>
                <div className="inline-flex items-center gap-2.5">
                  <Link href={`/users/${u.id}/edit`} className="font-bold text-[#284c35] hover:underline">
                    Ubah
                  </Link>
                  {u.id !== me.id && (
                    <ActionButton
                      action={toggleUserActiveAction}
                      values={{ id: u.id, next_active: u.is_active ? 'false' : 'true' }}
                      variant={u.is_active ? 'danger' : 'success'}
                    >
                      {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </ActionButton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}
