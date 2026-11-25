'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { submitInspectionAction } from '@/app/actions/supply.js';
import { Icon } from './icons.js';
import { ImageUploadField } from './ImageUploadField.js';
import { buttonClass, inputCls } from './styles.js';

export function InspectionForm({ shipment, orderItems }) {
  const [state, formAction, pending] = useActionState(submitInspectionAction, {});
  const [rows, setRows] = useState(
    orderItems.map((it) => ({
      product_id: it.product_id,
      sku: it.sku,
      name: it.product_name,
      ordered_qty: Number(it.quantity),
      actual_qty: String(it.quantity),
      result: 'sesuai',
      notes: '',
    })),
  );

  const updateRow = (idx, patch) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const allMatch = rows.every((r) => r.result === 'sesuai' && Number(r.actual_qty) === r.ordered_qty);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="shipment_id" value={shipment.id} />
      <input type="hidden" name="supply_order_id" value={shipment.supply_order_id} />
      <input type="hidden" name="inspection_items" value={JSON.stringify(rows)} />

      {state.message && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] font-medium text-red-900"
        >
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {/* Hasil per item — ringkas tanpa catatan per item */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-[13px] font-bold text-lobeans-ink">Pemeriksaan Per Item</h4>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              allMatch ? 'bg-[#eaf0e8] text-[#1e402b]' : 'bg-red-50 text-red-700'
            }`}
          >
            Kesimpulan otomatis: {allMatch ? 'Sesuai (Lanjut Catat Barang Masuk)' : 'Tidak Sesuai (Refund / Retur)'}
          </span>
        </div>

        {rows.map((r, idx) => {
          const qtyMismatch = Number(r.actual_qty) !== r.ordered_qty;
          return (
            <div
              key={r.product_id}
              className="grid grid-cols-1 gap-4 rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4 sm:grid-cols-12 sm:items-end"
            >
              <div className="sm:col-span-6">
                <p className="text-[13.5px] font-bold text-lobeans-ink">{r.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-lobeans-muted">
                  {r.sku} · Dipesan: <strong className="text-lobeans-ink">{r.ordered_qty} kg</strong>
                </p>
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-[11px] font-bold text-lobeans-muted">Aktual (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={r.actual_qty}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateRow(idx, {
                      actual_qty: v,
                      result: Number(v) === r.ordered_qty ? r.result : 'tidak_sesuai',
                    });
                  }}
                  className={`${inputCls} ${qtyMismatch ? 'border-red-400' : ''}`}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-[11px] font-bold text-lobeans-muted">Hasil mutu *</label>
                <select
                  value={r.result}
                  onChange={(e) => updateRow(idx, { result: e.target.value })}
                  className={inputCls}
                >
                  <option value="sesuai">Sesuai</option>
                  <option value="tidak_sesuai">Tidak Sesuai</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Catatan ringkasan pemeriksaan */}
      <div>
        <label htmlFor="notes" className="mb-1.5 block text-[12px] font-bold text-lobeans-ink">
          Catatan ringkasan pemeriksaan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          required
          placeholder="Ringkasan pemeriksaan kadar air, berat timbangan, kebersihan biji, dan segel karung..."
          className={`${inputCls} h-auto py-2.5`}
        />
      </div>

      {/* Foto bukti wajib + fitur Hapus Foto (tanpa foto standar gudang) */}
      <div className="space-y-3 rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
        <ImageUploadField
          name="photo"
          label="Foto bukti pemeriksaan"
          hint="Unggah foto fisik hasil pemeriksaan (wajib untuk hasil Sesuai maupun Tidak Sesuai)."
          required
          error={state.errors?.photo}
        />
        <input
          name="photo_caption"
          placeholder="Keterangan foto (mis. Hasil uji kadar air 12% & timbangan digital)"
          className={inputCls}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href="/inspections" className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <button type="submit" disabled={pending} className={buttonClass('primary', 'md')}>
          <Icon name="check" className="h-4 w-4" />
          {pending
            ? 'Menyimpan…'
            : allMatch
              ? 'Simpan & Lanjut Catat Barang Masuk →'
              : 'Kirim Laporan Tidak Sesuai ke Manager'}
        </button>
      </div>
    </form>
  );
}
