import { redirect } from 'next/navigation';

// Sesuai ketentuan final: Admin, Manager, dan Staff dibuat melalui data awal .sql; Supplier mendaftar mandiri via /register.
export default function DisabledNewUserPage() {
  redirect('/users');
}
