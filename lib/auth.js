import { cache } from 'react';
import { redirect } from 'next/navigation';
import { one } from './db.js';
import { readSession } from './session.js';

/** Pengguna yang sedang login — selalu dicek status aktif dan role-nya dari database. */
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await one(
    `SELECT u.id, u.name, u.email, u.is_active, u.supplier_id,
            r.code AS role, r.name AS role_name,
            s.company_name, s.supplier_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN suppliers s ON s.id = u.supplier_id
      WHERE u.id = $1`,
    [session.uid],
  );
  if (!user || !user.is_active) return null;
  return user;
});

/** Pastikan pengguna login, aktif, dan memiliki salah satu role yang diizinkan (server-side guard). */
export async function requireUser(roles) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (roles && !roles.includes(user.role)) {
    redirect('/dashboard?err=' + encodeURIComponent('Anda tidak memiliki izin mengakses halaman tersebut.'));
  }
  return user;
}
