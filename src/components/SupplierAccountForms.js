'use client';

import { useActionState, useState } from 'react';
import { changeSupplierPasswordAction, updateSupplierProfileAction } from '@/app/actions/account.js';
import { ActionForm, Field, Input, SubmitButton, Textarea } from './ActionForm.js';
import { Icon } from './icons.js';
import { ImageUploadField } from './ImageUploadField.js';
import { buttonClass, inputCls } from './styles.js';

export function SupplierProfileForm({ initial }) {
  return (
    <ActionForm action={updateSupplierProfileAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Perusahaan / Koperasi" name="company_name" required>
          <Input name="company_name" defaultValue={initial.company_name} placeholder="Mis. Koperasi Kopi Gayo" required />
        </Field>
        <Field label="Nama Penanggung Jawab (PIC)" name="contact_name" required>
          <Input name="contact_name" defaultValue={initial.contact_name} placeholder="Nama lengkap penanggung jawab" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email Login" name="email" required hint="Digunakan untuk masuk ke portal supplier.">
          <Input name="email" type="email" defaultValue={initial.email} placeholder="kontak@koperasi.co.id" required />
        </Field>
        <Field label="Nomor Telepon / WhatsApp" name="phone" required>
          <Input name="phone" defaultValue={initial.phone} placeholder="0812-xxxx-xxxx" required />
        </Field>
      </div>

      <Field label="Alamat Lengkap Usaha / Gudang" name="address" required>
        <Textarea name="address" rows={3} defaultValue={initial.address} placeholder="Kecamatan, Kabupaten/Kota, Provinsi" required />
      </Field>

      <div className="rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] font-bold text-lobeans-ink">Dokumen Profil / Legalitas Usaha</span>
          {initial.document_url && (
            <a
              href={initial.document_url}
              target="_blank"
              rel="noreferrer"
              className="text-[11.5px] font-bold text-lobeans-forest hover:underline"
            >
              Lihat dokumen saat ini →
            </a>
          )}
        </div>
        <ImageUploadField
          name="document"
          hint="Opsional — unggah file baru (JPG/PNG/WEBP, maks. 2 MB) jika ingin mengganti dokumen legalitas."
          existingUrl={initial.document_url}
        />
      </div>

      <div className="flex justify-end border-t border-[#eeede6] pt-4">
        <SubmitButton pendingText="Menyimpan perubahan…">Simpan Perubahan Profil</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function SupplierPasswordForm() {
  const [state, formAction, pending] = useActionState(changeSupplierPasswordAction, {});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-[10px] border px-4 py-3 text-[12px] font-medium ${
            state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <Icon name={state.ok ? 'check' : 'alert'} className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <div>
        <label htmlFor="current_password" className="mb-1.5 block text-[12px] font-medium text-lobeans-ink-light">
          Kata Sandi Saat Ini <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="current_password"
            name="current_password"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="Masukkan kata sandi saat ini"
            className={`${inputCls} pr-11 ${state.errors?.current_password ? 'border-red-400' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            aria-label={showCurrent ? 'Sembunyikan kata sandi saat ini' : 'Lihat kata sandi saat ini'}
            className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#284c35] transition-colors hover:bg-black/5 hover:text-lobeans-ink"
          >
            <Icon name={showCurrent ? 'eye-off' : 'eye'} className="h-[18px] w-[18px]" />
          </button>
        </div>
        {state.errors?.current_password && <p className="mt-1 text-[11px] text-red-600">{state.errors.current_password}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new_password" className="mb-1.5 block text-[12px] font-medium text-lobeans-ink-light">
            Kata Sandi Baru <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="new_password"
              name="new_password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
              className={`${inputCls} pr-11 ${state.errors?.new_password ? 'border-red-400' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? 'Sembunyikan kata sandi baru' : 'Lihat kata sandi baru'}
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#284c35] transition-colors hover:bg-black/5 hover:text-lobeans-ink"
            >
              <Icon name={showNew ? 'eye-off' : 'eye'} className="h-[18px] w-[18px]" />
            </button>
          </div>
          {state.errors?.new_password && <p className="mt-1 text-[11px] text-red-600">{state.errors.new_password}</p>}
        </div>

        <div>
          <label htmlFor="confirm_password" className="mb-1.5 block text-[12px] font-medium text-lobeans-ink-light">
            Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Ulangi kata sandi baru"
            className={`${inputCls} ${state.errors?.confirm_password ? 'border-red-400' : ''}`}
          />
          {state.errors?.confirm_password && <p className="mt-1 text-[11px] text-red-600">{state.errors.confirm_password}</p>}
        </div>
      </div>

      <div className="flex justify-end border-t border-[#eeede6] pt-4">
        <button type="submit" disabled={pending} className={buttonClass('dark', 'md')}>
          {pending ? 'Memperbarui…' : 'Ubah Kata Sandi'}
        </button>
      </div>
    </form>
  );
}
