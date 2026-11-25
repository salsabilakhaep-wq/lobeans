'use client';

import Link from 'next/link';
import { ActionForm, Field, Input, Select, SubmitButton, Textarea } from './ActionForm.js';
import { ItemsEditor } from './ItemsEditor.js';
import { buttonClass } from './styles.js';

export function SupplyOrderForm({ action, suppliers, products, today, nextWeek, defaultProductId = null }) {
  const initialItems = defaultProductId ? [{ product_id: Number(defaultProductId), quantity: 25 }] : undefined;

  return (
    <ActionForm action={action} className="space-y-5">
      <Field label="Pilih Supplier tujuan" name="supplier_id" required>
        <Select name="supplier_id" defaultValue={suppliers[0]?.id ?? ''} required>
          {suppliers.length === 0 && <option value="">Belum ada supplier aktif</option>}
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.company_name} ({s.supplier_code} · {s.contact_name})
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Tanggal permintaan" name="order_date" required>
          <Input name="order_date" type="date" defaultValue={today} required />
        </Field>
        <Field label="Target tanggal tiba" name="expected_date" required>
          <Input name="expected_date" type="date" defaultValue={nextWeek} required />
        </Field>
      </div>

      <ItemsEditor products={products} initialItems={initialItems} />

      <Field
        label="Catatan permintaan pasokan"
        name="notes"
        required
        hint="Cantumkan standar mutu, kadar air, kemasan karung, atau catatan pengiriman."
      >
        <Textarea
          name="notes"
          placeholder="Mis. Permintaan restock Arabika Gayo Grade 1 kemasan karung 50 kg, kadar air maksimal 12%."
          rows={3}
          required
        />
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href="/supply-orders" className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <SubmitButton>Kirim Permintaan ke Supplier</SubmitButton>
      </div>
    </ActionForm>
  );
}
