'use client';

import Link from 'next/link';
import { ActionForm, Field, Input, SubmitButton, Textarea } from './ActionForm.js';
import { ItemsEditor } from './ItemsEditor.js';
import { buttonClass } from './styles.js';

export function OutgoingForm({ action, products, today, initial = {}, initialItems = null, isEdit = false }) {
  const rawInitialDate = initial.trx_date
    ? typeof initial.trx_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(initial.trx_date)
      ? initial.trx_date
      : new Date(initial.trx_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
    : today;
  const defaultDate = rawInitialDate >= today ? rawInitialDate : today;

  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Tanggal pengiriman" name="trx_date" required>
          <Input name="trx_date" type="date" defaultValue={defaultDate} min={today} required />
        </Field>
        <Field label="Nama customer / penerima" name="recipient_name" required className="sm:col-span-2">
          <Input
            name="recipient_name"
            defaultValue={initial.recipient_name || ''}
            placeholder="Mis. Komorebi Specialty Roastery"
            required
          />
        </Field>
      </div>

      <Field label="Tujuan pengiriman" name="destination" required>
        <Input
          name="destination"
          defaultValue={initial.destination || ''}
          placeholder="Mis. Jl. Dago No. 45, Bandung"
          required
        />
      </Field>

      <ItemsEditor products={products} initialItems={initialItems} checkStock />

      <Field label="Catatan pengiriman" name="notes" required>
        <Textarea
          name="notes"
          defaultValue={initial.notes || ''}
          placeholder="Catatan kemasan atau jadwal penjemputan"
          rows={3}
          required
        />
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href={isEdit ? `/transactions/${initial.id}` : '/transactions/out'} className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <SubmitButton>{isEdit ? 'Simpan Perubahan' : 'Ajukan Barang Keluar (Pending)'}</SubmitButton>
      </div>
    </ActionForm>
  );
}
