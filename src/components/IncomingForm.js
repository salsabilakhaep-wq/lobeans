'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ActionForm, Field, Input, SubmitButton, Textarea } from './ActionForm.js';
import { buttonClass, inputCls } from './styles.js';

export function IncomingForm({ action, eligibleInspections = [], defaultInspectionId = null, today }) {
  const initialId =
    (defaultInspectionId && eligibleInspections.some((e) => Number(e.id) === Number(defaultInspectionId))
      ? String(defaultInspectionId)
      : String(eligibleInspections[0]?.id || ''));

  const [selectedId, setSelectedId] = useState(initialId);
  const selected = eligibleInspections.find((e) => String(e.id) === selectedId) || null;

  if (eligibleInspections.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-[12px] border border-amber-200 bg-amber-50/70 px-4 py-4 text-[12.5px] text-amber-950">
          <p className="font-bold">Belum ada hasil pemeriksaan yang siap dicatat sebagai Barang Masuk.</p>
          <p className="mt-1 text-[12px] text-amber-900">
            Catatan Barang Masuk hanya dapat dibuat untuk pengiriman yang telah selesai diperiksa dengan hasil <strong>Sesuai</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inspections" className={buttonClass('primary', 'md')}>
            Buka Pemeriksaan Barang →
          </Link>
          <Link href="/transactions/in" className={buttonClass('secondary', 'md')}>
            ← Barang Masuk (IN)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Hasil pemeriksaan yang lolos (Sesuai)" name="inspection_id" required>
          <select
            id="inspection_id"
            name="inspection_id"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
            className={inputCls}
          >
            {eligibleInspections.map((ins) => (
              <option key={ins.id} value={ins.id}>
                {ins.order_number} · {ins.shipment_number} ({ins.supplier_name})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal pencatatan barang masuk" name="trx_date" required>
          <Input name="trx_date" type="date" defaultValue={today} min={today} required />
        </Field>
      </div>

      {selected && (
        <div className="space-y-3 rounded-[14px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e4dc] pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-lobeans-muted">Ringkasan Hasil Pemeriksaan</p>
              <p className="mt-0.5 text-[14px] font-bold text-lobeans-ink">
                {selected.supplier_name} <span className="font-mono text-[12px] font-semibold text-lobeans-muted">· {selected.order_number}</span>
              </p>
            </div>
            <span className="rounded-full border border-[#cce0ca] bg-[#e7f1e6] px-3 py-1 text-[11px] font-bold text-[#1f4d2e]">
              Pemeriksaan: Sesuai
            </span>
          </div>

          <div className="space-y-2">
            {selected.items.map((it) => (
              <div key={it.product_id} className="flex items-center justify-between rounded-[10px] border border-[#eeede6] bg-white px-3.5 py-2.5 text-[12.5px]">
                <div>
                  <p className="font-bold text-lobeans-ink">{it.product_name}</p>
                  <p className="font-mono text-[10.5px] text-lobeans-muted">{it.sku}</p>
                </div>
                <p className="font-bold text-emerald-700 tabular-nums">
                  +{it.actual_qty} {it.unit}
                </p>
              </div>
            ))}
          </div>

          {selected.photo_url && (
            <div className="flex items-center gap-3 pt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.photo_url}
                alt="Foto bukti pemeriksaan"
                className="h-16 w-20 rounded-[8px] border border-[#e5e4dc] object-cover"
              />
              <div className="text-[11.5px]">
                <p className="font-bold text-lobeans-ink">Foto Bukti Pemeriksaan Terlampir</p>
                <p className="text-lobeans-muted">{selected.inspection_notes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Field
        label="Catatan barang masuk untuk Manager Gudang"
        name="notes"
        required
        hint="Cantumkan lokasi penempatan rak/silo atau catatan serah terima penerimaan."
      >
        <Textarea
          name="notes"
          defaultValue={selected ? `Hasil pemeriksaan ${selected.shipment_number} sesuai, siap masuk stok gudang.` : ''}
          placeholder="Mis. Seluruh karung telah diperiksa sesuai standar, siap ditempatkan di Silo A."
          rows={3}
          required
        />
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href="/transactions/in" className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <SubmitButton>Ajukan Catatan Barang Masuk ke Manager</SubmitButton>
      </div>
    </ActionForm>
  );
}
