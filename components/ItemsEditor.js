'use client';

import { useState } from 'react';
import { Icon } from './icons.js';
import { useFormCtx } from './ActionForm.js';
import { buttonClass, inputCls } from './styles.js';

export function ItemsEditor({ products, initialItems, checkStock = false }) {
  const { errors } = useFormCtx();
  const [rows, setRows] = useState(
    initialItems?.length
      ? initialItems.map((it) => ({ product_id: String(it.product_id), quantity: String(it.quantity) }))
      : [{ product_id: String(products[0]?.id || ''), quantity: '25' }],
  );

  const update = (idx, patch) => setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  const add = () => setRows((r) => [...r, { product_id: String(products[0]?.id || ''), quantity: '25' }]);
  const remove = (idx) => setRows((r) => (r.length > 1 ? r.filter((_, i) => i !== idx) : r));

  const payload = JSON.stringify(
    rows.map((r) => ({ product_id: Number(r.product_id), quantity: Number(r.quantity) })),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-medium text-lobeans-ink-light">
          Daftar item green bean <span className="text-red-500">*</span>
        </label>
        <button type="button" onClick={add} className={buttonClass('secondary', 'sm')}>
          <Icon name="plus" className="h-3.5 w-3.5" />
          Tambah baris
        </button>
      </div>

      <input type="hidden" name="items" value={payload} />

      <div className="space-y-2.5">
        {rows.map((row, idx) => {
          const prod = products.find((p) => String(p.id) === String(row.product_id));
          const over = checkStock && prod && Number(row.quantity) > Number(prod.stock);
          return (
            <div key={idx} className="grid grid-cols-1 gap-2.5 rounded-[10px] border border-[#e6e5de] bg-[#fcfcf9] p-3 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-7">
                <select
                  value={row.product_id}
                  onChange={(e) => update(idx, { product_id: e.target.value })}
                  className={inputCls}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({p.category_name} · stok {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={row.quantity}
                    onChange={(e) => update(idx, { quantity: e.target.value })}
                    placeholder="Kuantitas"
                    className={`${inputCls} pr-12 ${over ? 'border-red-400' : ''}`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-lobeans-muted">
                    kg
                  </span>
                </div>
                {over && (
                  <p className="mt-1 text-[10px] text-red-600">
                    Melebihi stok tersedia ({prod.stock} {prod.unit})
                  </p>
                )}
              </div>
              <div className="flex justify-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  disabled={rows.length === 1}
                  className="rounded-lg p-2 text-lobeans-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label="Hapus baris"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {errors.items && <p className="text-[11px] text-red-600">{errors.items}</p>}
    </div>
  );
}
