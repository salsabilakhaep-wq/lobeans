'use client';

import Link from 'next/link';
import { PROCESS_METHODS, PRODUCT_UNITS } from '@/lib/constants.js';
import { ActionForm, Field, Input, Select, SubmitButton, Textarea } from './ActionForm.js';
import { ImageUploadField } from './ImageUploadField.js';
import { buttonClass } from './styles.js';

export function ProductForm({ action, categories, initial = {}, isEdit = false }) {
  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Kode SKU" name="sku" required={!isEdit} hint={isEdit ? 'SKU bersifat unik dan tidak dapat diubah.' : 'Mis. ARB-GYO-02'}>
          <Input name="sku" defaultValue={initial.sku} placeholder="ARB-GYO-02" disabled={isEdit} required={!isEdit} />
        </Field>
        <Field label="Nama produk green bean" name="name" required>
          <Input name="name" defaultValue={initial.name} placeholder="Mis. Arabika Gayo Grade 1" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Kategori kopi" name="category_id" required>
          <Select name="category_id" defaultValue={initial.category_id ?? categories[0]?.id} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Varietas" name="variety" required>
          <Input name="variety" defaultValue={initial.variety} placeholder="Ateng Super / S795 / BP 42" required />
        </Field>
        <Field label="Metode proses" name="process_method" required>
          <Select name="process_method" defaultValue={initial.process_method || 'Semi-Washed'} required>
            {PROCESS_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Asal wilayah" name="origin_region" required>
          <Input name="origin_region" defaultValue={initial.origin_region} placeholder="Aceh Tengah / Tana Toraja" required />
        </Field>
        <Field label="Lokasi rak / silo" name="rack_location" required>
          <Input name="rack_location" defaultValue={initial.rack_location} placeholder="Silo-A1 / Pallet-B2" required />
        </Field>
        <Field label="Satuan (Unit)" name="unit" required>
          <Select name="unit" defaultValue={initial.unit || 'kg'} required>
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Harga beli (Rp)" name="buy_price" required>
          <Input name="buy_price" type="number" step="0.01" min="0" defaultValue={initial.buy_price} placeholder="98000" required />
        </Field>
        <Field label="Harga jual (Rp)" name="sell_price" required>
          <Input name="sell_price" type="number" step="0.01" min="0" defaultValue={initial.sell_price} placeholder="140000" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Jumlah stok saat ini" name="stock" required hint="Nilai tidak boleh negatif.">
          <Input name="stock" type="number" step="0.01" min="0" defaultValue={initial.stock ?? 0} required />
        </Field>
        <Field label="Stok minimum (Severe)" name="min_stock" required hint="Stok ≤ batas ini berstatus Severe.">
          <Input name="min_stock" type="number" step="0.01" min="0" defaultValue={initial.min_stock ?? 15} required />
        </Field>
        <Field label="Ambang stok rendah (Low)" name="low_stock" required hint="Wajib lebih besar dari stok minimum.">
          <Input name="low_stock" type="number" step="0.01" min="1" defaultValue={initial.low_stock ?? 40} required />
        </Field>
      </div>

      <p className="rounded-[10px] border border-[#e6e5de] bg-[#faf9f5] px-4 py-3 text-[11.5px] text-lobeans-muted">
        <strong className="font-bold text-lobeans-ink">Status Stok Otomatis:</strong> Sistem menghitung status secara otomatis — <strong>Out of Stock</strong> (0), <strong>Severe</strong> (≤ stok minimum), <strong>Low</strong> (≤ ambang rendah), dan <strong>Normal</strong>.
      </p>

      <Field label="Deskripsi & catatan mutu" name="description" required>
        <Textarea name="description" defaultValue={initial.description} placeholder="Kadar air, profil citarasa, atau catatan grade" rows={3} required />
      </Field>

      <div className="rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
        <ImageUploadField
          name="image"
          label="Foto produk"
          hint={isEdit ? 'Unggah foto baru jika ingin mengganti gambar produk (JPG/PNG/WEBP).' : 'Unggah foto produk green bean (JPG/PNG/WEBP).'}
          required={!isEdit}
          existingUrl={isEdit ? initial.image_url : null}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href="/products" className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <SubmitButton>{isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}</SubmitButton>
      </div>
    </ActionForm>
  );
}
