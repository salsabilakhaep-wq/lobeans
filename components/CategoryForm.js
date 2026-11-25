'use client';

import Link from 'next/link';
import { ActionForm, Field, Input, SubmitButton, Textarea } from './ActionForm.js';
import { ImageUploadField } from './ImageUploadField.js';
import { buttonClass } from './styles.js';

export function CategoryForm({ action, initial = {}, isEdit = false }) {
  return (
    <ActionForm action={action} className="space-y-5">
      <Field label="Nama kategori" name="name" required hint="Mis. Arabika, Robusta, Liberika, Excelsa">
        <Input name="name" defaultValue={initial.name} placeholder="Nama kategori kopi" required />
      </Field>
      <Field label="Deskripsi" name="description" required>
        <Textarea name="description" defaultValue={initial.description} placeholder="Karakteristik rasa, daerah tumbuh, atau standar mutu" rows={3} required />
      </Field>
      <div className="rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
        <ImageUploadField
          name="image"
          label="Gambar kategori"
          hint={isEdit ? 'Unggah gambar baru jika ingin mengganti gambar kategori (JPG/PNG/WEBP).' : 'Unggah gambar kategori kopi (JPG/PNG/WEBP).'}
          required={!isEdit}
          existingUrl={isEdit ? initial.image_url : null}
        />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href="/categories" className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <SubmitButton>{isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}</SubmitButton>
      </div>
    </ActionForm>
  );
}
