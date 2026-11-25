import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { one } from '@/lib/db.js';
import { fmtDate } from '@/lib/format.js';
import { SupplierPasswordForm, SupplierProfileForm } from '@/components/SupplierAccountForms.js';
import { Card, Flash, LinkButton, PageHeader, StatusBadge } from '@/components/ui.js';

export const metadata = { title: 'Kelola Akun Supplier' };

export default async function SupplierAccountPage({ searchParams }) {
  const user = await requireUser(['supplier']);
  const sp = await searchParams;
  if (!user.supplier_id) notFound();

  const supplier = await one(
    `SELECT s.*, u.name AS account_name, u.email AS account_email, u.created_at AS account_created_at
       FROM suppliers s
       JOIN users u ON u.supplier_id = s.id AND u.id = $1
      WHERE s.id = $2`,
    [user.id, user.supplier_id],
  );
  if (!supplier) notFound();

  return (
    <>
      <Flash ok={sp?.ok} err={sp?.err} />

      <PageHeader
        eyebrow={`Portal Supplier · ${supplier.supplier_code}`}
        title="Kelola Akun"
        subtitle="Perbarui profil usaha, informasi kontak, dokumen legalitas, serta keamanan kata sandi akun Anda."
        action={
          <LinkButton href="/dashboard" variant="secondary">
            ← Dashboard
          </LinkButton>
        }
      />

      <div className="space-y-6">
        {/* Ringkasan Identitas Mitra */}
        <div className="grid grid-cols-1 gap-4 rounded-[16px] border border-[#e5e4dc] bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">Kode Mitra</p>
            <p className="mt-1 font-mono text-[15px] font-bold text-lobeans-forest">{supplier.supplier_code}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">Status Verifikasi</p>
            <div className="mt-1">
              <StatusBadge status={supplier.verification_status} />
            </div>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">Status Akun</p>
            <div className="mt-1">
              <StatusBadge status={supplier.is_active ? 'active' : 'inactive'} />
            </div>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-lobeans-muted">Terdaftar Sejak</p>
            <p className="mt-1 text-[13.5px] font-bold text-lobeans-ink">{fmtDate(supplier.account_created_at || supplier.created_at)}</p>
          </div>
        </div>

        {/* 1. Form Profil Akun & Usaha */}
        <Card
          title="Profil Akun & Data Usaha"
          subtitle="Perubahan nama penanggung jawab dan email akan otomatis diperbarui pada profil login Anda."
          padded
        >
          <SupplierProfileForm
            initial={{
              company_name: supplier.company_name,
              contact_name: supplier.contact_name || supplier.account_name,
              email: supplier.account_email,
              phone: supplier.phone,
              address: supplier.address || '',
              document_url: supplier.document_url || null,
            }}
          />
        </Card>

        {/* 2. Form Keamanan & Ubah Kata Sandi */}
        <Card
          title="Keamanan & Ubah Kata Sandi"
          subtitle="Gunakan kata sandi minimal 8 karakter. Kata sandi baru langsung dienkripsi menggunakan bcryptjs."
          padded
        >
          <SupplierPasswordForm />
        </Card>
      </div>
    </>
  );
}
