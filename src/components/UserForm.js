'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ActionForm, Field, Input, Select, SubmitButton, Textarea, useFormCtx } from './ActionForm.js';
import { Icon } from './icons.js';
import { ImageUploadField } from './ImageUploadField.js';
import { buttonClass, inputCls } from './styles.js';

function PasswordInputWithToggle({ isEdit }) {
  const { errors } = useFormCtx();
  const [showPw, setShowPw] = useState(false);

  return (
    <Field
      label={isEdit ? 'Kata sandi baru (opsional)' : 'Kata sandi'}
      name="password"
      required={!isEdit}
      hint={isEdit ? 'Kosongkan jika tidak ingin mengganti kata sandi.' : 'Minimal 8 karakter (langsung dienkripsi dengan bcryptjs).'}
    >
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPw ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={isEdit ? 'Biarkan kosong jika tetap' : 'Minimal 8 karakter'}
          required={!isEdit}
          minLength={isEdit ? undefined : 8}
          className={`${inputCls} pr-11 ${errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
          className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#284c35] transition-colors hover:bg-black/5 hover:text-lobeans-ink"
        >
          <Icon name={showPw ? 'eye-off' : 'eye'} className="h-[18px] w-[18px]" />
        </button>
      </div>
    </Field>
  );
}

function SupplierInlineFields({ suppliers, supplierMode, setSupplierMode }) {
  const { errors } = useFormCtx();

  return (
    <div className="space-y-4 rounded-[14px] border border-[#e5e4dc] bg-[#faf9f5] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e6dd] pb-3">
        <div>
          <p className="text-[13px] font-bold text-lobeans-ink">Data Profil Mitra Supplier</p>
          <p className="text-[11.5px] text-lobeans-muted">
            Supplier yang ditambahkan oleh Admin akan otomatis aktif dan terverifikasi.
          </p>
        </div>
        {suppliers.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-[#dedcd2] bg-white p-1 text-[11.5px] font-semibold">
            <button
              type="button"
              onClick={() => setSupplierMode('new')}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                supplierMode === 'new' ? 'bg-lobeans-forest text-lobeans-cream' : 'text-lobeans-muted hover:text-lobeans-ink'
              }`}
            >
              Buat Profil Baru
            </button>
            <button
              type="button"
              onClick={() => setSupplierMode('existing')}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                supplierMode === 'existing' ? 'bg-lobeans-forest text-lobeans-cream' : 'text-lobeans-muted hover:text-lobeans-ink'
              }`}
            >
              Hubungkan Profil ({suppliers.length})
            </button>
          </div>
        )}
      </div>

      <input type="hidden" name="supplier_mode" value={supplierMode} />

      {supplierMode === 'existing' && suppliers.length > 0 ? (
        <Field label="Pilih Profil Supplier" name="supplier_id" required>
          <Select name="supplier_id" defaultValue={suppliers[0]?.id || ''} required>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.supplier_code} — {s.company_name}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nama Perusahaan / Koperasi" name="company_name" required>
              <Input name="company_name" placeholder="Mis. Koperasi Kopi Flores" required />
            </Field>
            <Field label="Nomor Telepon / WhatsApp" name="phone" required>
              <Input name="phone" placeholder="0812-xxxx-xxxx" required />
            </Field>
          </div>
          <Field label="Alamat Lengkap" name="address" required>
            <Textarea name="address" rows={2} placeholder="Kecamatan, Kabupaten/Kota, Provinsi" required />
          </Field>
          <div className="rounded-[12px] border border-[#e5e4dc] bg-white p-3.5">
            <ImageUploadField
              name="document"
              label="Dokumen Profil / Legalitas Supplier"
              hint="Unggah foto SIUP / NIB / surat keterangan koperasi (JPG/PNG/WEBP, maks. 2 MB)."
              required
              error={errors.document}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function UserForm({ action, suppliers = [], initial = {}, defaultRole = 'staff', isEdit = false }) {
  const validInitialRole = isEdit
    ? initial.role || 'staff'
    : ['staff', 'manager', 'supplier'].includes(defaultRole)
      ? defaultRole
      : 'staff';

  const [role, setRole] = useState(validInitialRole);
  const [supplierMode, setSupplierMode] = useState('new');

  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={role === 'supplier' ? 'Nama Penanggung Jawab (PIC)' : 'Nama lengkap'} name="name" required>
          <Input name="name" defaultValue={initial.name} placeholder="Mis. Ahmad Fauzi Ali" required />
        </Field>
        <Field label="Email Login" name="email" required>
          <Input name="email" type="email" defaultValue={initial.email} placeholder="nama@lobeans.test" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Role Pengguna" name="role" required>
          <Select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            {isEdit && <option value="admin">Admin</option>}
            <option value="staff">Staff Gudang</option>
            <option value="manager">Manager Gudang</option>
            <option value="supplier">Supplier</option>
          </Select>
        </Field>

        {isEdit ? (
          <Field label="Status akun" name="is_active">
            <Select name="is_active" defaultValue={initial.is_active === false ? 'false' : 'true'}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
          </Field>
        ) : (
          <div className="flex items-end pb-1 text-[11.5px] text-lobeans-muted">
            Akun baru langsung aktif dan dapat digunakan untuk login di portal LOBEANS.
          </div>
        )}
      </div>

      {!isEdit && role === 'supplier' && (
        <SupplierInlineFields
          suppliers={suppliers}
          supplierMode={supplierMode}
          setSupplierMode={setSupplierMode}
        />
      )}

      <PasswordInputWithToggle isEdit={isEdit} />

      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href="/users" className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <SubmitButton>{isEdit ? 'Simpan Perubahan' : 'Buat Akun Pengguna'}</SubmitButton>
      </div>
    </ActionForm>
  );
}
