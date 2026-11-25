import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { many } from '@/lib/db.js';
import { toggleSupplierActiveAction } from '@/app/actions/suppliers.js';
import { ActionButton } from '@/components/ActionForm.js';
import { SupplierVerifyActions } from '@/components/SupplierVerifyActions.js';
import { Card, DataTable, Flash, LinkButton, PageHeader, StatusBadge, hideCls, td } from '@/components/ui.js';

export const metadata = { title: 'Verifikasi & Data Supplier' };

export default async function SuppliersPage({ searchParams }) {
  await requireUser(['admin']);
  const sp = await searchParams;

  const suppliers = await many(
    `SELECT s.*, u.email AS account_email,
            (SELECT COUNT(*) FROM supply_orders so WHERE so.supplier_id = s.id)::int AS order_count
       FROM suppliers s
       LEFT JOIN users u ON u.supplier_id = s.id
      ORDER BY CASE s.verification_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, s.id ASC`,
  );

  const pendingSuppliers = suppliers.filter((s) => s.verification_status === 'pending');
  const otherSuppliers = suppliers.filter((s) => s.verification_status !== 'pending');

  return (
    <>
      <Flash ok={sp.ok} err={sp.err} />

      <PageHeader
        eyebrow="Kemitraan Pemasok"
        title="Verifikasi & Data Supplier"
        subtitle="Verifikasi pendaftaran mitra supplier baru dan kelola profil koperasi atau kelompok tani green bean."
        action={
          <LinkButton href="/suppliers/new" icon="plus">
            Tambah Supplier
          </LinkButton>
        }
      />

      <div className="space-y-6">
        {pendingSuppliers.length > 0 && (
          <Card
            title={`Menunggu Verifikasi (${pendingSuppliers.length})`}
            subtitle="Setujui pendaftaran agar supplier dapat masuk ke portal dan menerima permintaan pasokan."
            className="border-amber-300/80"
          >
            <DataTable
              head={[
                { label: 'Perusahaan & Alamat' },
                { label: 'Kontak & Email' },
                { label: 'Dokumen', hide: 'md' },
                { label: 'Status' },
                { label: 'Verifikasi', align: 'right' },
              ]}
            >
              {pendingSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-[#faf9f5]">
                  <td className={td}>
                    <p className="font-bold text-lobeans-ink">{s.company_name}</p>
                    <p className="text-[11px] text-lobeans-muted">
                      {s.supplier_code} · {s.address || '-'}
                    </p>
                  </td>
                  <td className={td}>
                    <p className="font-semibold text-lobeans-ink">{s.contact_name}</p>
                    <p className="font-mono text-[11px] text-lobeans-muted">
                      {s.phone} · {s.account_email || s.email}
                    </p>
                  </td>
                  <td className={`${td} ${hideCls('md')}`}>
                    {s.document_url ? (
                      <a href={s.document_url} target="_blank" rel="noreferrer" className="text-[11.5px] font-bold text-lobeans-forest underline">
                        Lihat Dokumen
                      </a>
                    ) : (
                      <span className="text-[11.5px] text-lobeans-muted">-</span>
                    )}
                  </td>
                  <td className={td}>
                    <StatusBadge status="pending" label="Menunggu Verifikasi" />
                  </td>
                  <td className={`${td} text-right`}>
                    <SupplierVerifyActions supplierId={s.id} />
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        )}

        <Card
          title={`Daftar Mitra Supplier (${otherSuppliers.length})`}
          subtitle="Setiap akun supplier hanya memiliki akses ke data pesanan miliknya sendiri."
        >
          <DataTable
            head={[
              { label: 'Kode & Perusahaan' },
              { label: 'Kontak & Telepon' },
              { label: 'Akun Login', hide: 'md' },
              { label: 'Pesanan', align: 'right', hide: 'sm' },
              { label: 'Status' },
              { label: 'Aksi', align: 'right' },
            ]}
            empty={otherSuppliers.length === 0}
          >
            {otherSuppliers.map((s) => (
              <tr key={s.id} className="hover:bg-[#faf9f5]">
                <td className={td}>
                  <p className="font-bold text-lobeans-ink">{s.company_name}</p>
                  <p className="font-mono text-[11px] text-lobeans-muted">
                    {s.supplier_code} {s.address ? `· ${s.address}` : ''}
                  </p>
                </td>
                <td className={td}>
                  <p className="font-semibold text-lobeans-ink">{s.contact_name}</p>
                  <p className="font-mono text-[11px] text-lobeans-muted">{s.phone}</p>
                </td>
                <td className={`${td} ${hideCls('md')} text-[11.5px] text-lobeans-muted`}>
                  {s.account_email || <span className="italic">Belum ada akun</span>}
                </td>
                <td className={`${td} ${hideCls('sm')} text-right font-bold tabular-nums`}>{s.order_count}</td>
                <td className={td}>
                  {s.verification_status === 'rejected' ? (
                    <StatusBadge status="rejected" label="Ditolak" />
                  ) : (
                    <StatusBadge status={s.is_active ? 'active' : 'inactive'} />
                  )}
                </td>
                <td className={`${td} text-right`}>
                  <div className="inline-flex items-center gap-2.5">
                    <Link href={`/suppliers/${s.id}/edit`} className="font-bold text-[#284c35] hover:underline">
                      Ubah
                    </Link>
                    {s.verification_status === 'approved' && (
                      <ActionButton
                        action={toggleSupplierActiveAction}
                        values={{ id: s.id, next_active: s.is_active ? 'false' : 'true' }}
                        variant={s.is_active ? 'danger' : 'success'}
                      >
                        {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </ActionButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </div>
    </>
  );
}
