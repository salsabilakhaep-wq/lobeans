'use client';

import Link from 'next/link';
import { ActionForm, Field, Input, SubmitButton, Textarea } from './ActionForm.js';
import { ImageUploadField } from './ImageUploadField.js';
import { buttonClass } from './styles.js';

export function SupplierForm({ action, initial = {}, isEdit = false }) {
  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Kode supplier" name="supplier_code" required hint="Unik, mis. SUP-003">
          <Input name="supplier_code" defaultValue={initial.supplier_code} placeholder="SUP-003" required />
        </Field>
        <Field label="Nama perusahaan / koperasi" name="company_name" required className="sm:col-span-2">
          <Input name="company_name" defaultValue={initial.company_name} placeholder="Mis. Koperasi Tani Kopi Kintamani" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Penanggung jawab" name="contact_name" required>
          <Input name="contact_name" defaultValue={initial.contact_name} placeholder="Nama kontak" required />
        </Field>
        <Field label="Telepon" name="phone" required>
          <Input name="phone" defaultValue={initial.phone} placeholder="0812-xxxx-xxxx" required />
        </Field>
        <Field label="Email kontak" name="email" required>
          <Input name="email" type="email" defaultValue={initial.email} placeholder="mitra@kopi.id" required />
        </Field>
      </div>

      <Field label="Alamat / wilayah asal" name="address">
        <Textarea name="address" defaultValue={initial.address} placeholder="Alamat koperasi atau sentra kebun kopi" rows={2} />
      </Field>

      <div className="rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
        <ImageUploadField
          name="document"
          label="Dokumen / foto verifikasi supplier"
          hint="Unggah foto dokumen profil / legalitas usaha (JPG/PNG/WEBP)."
          required={!isEdit}
          existingUrl={isEdit ? initial.document_url : null}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href="/suppliers" className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <SubmitButton>{isEdit ? 'Simpan Perubahan' : 'Tambah Supplier'}</SubmitButton>
      </div>
    </ActionForm>
  );
}
