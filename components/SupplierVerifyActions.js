'use client';

import { useActionState, useState } from 'react';
import { approveSupplierAction, rejectSupplierAction } from '@/app/actions/suppliers.js';
import { buttonClass, inputCls } from './styles.js';

export function SupplierVerifyActions({ supplierId }) {
  const [showReject, setShowReject] = useState(false);
  const [appSt, appAct, appPend] = useActionState(approveSupplierAction, {});
  const [rejSt, rejAct, rejPend] = useActionState(rejectSupplierAction, {});

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="inline-flex items-center gap-2">
        <form action={appAct}>
          <input type="hidden" name="id" value={supplierId} />
          <button type="submit" disabled={appPend} className={buttonClass('success', 'sm')}>
            {appPend ? 'Menyetujui…' : 'Setujui'}
          </button>
        </form>
        <button type="button" onClick={() => setShowReject(!showReject)} className={buttonClass('danger', 'sm')}>
          Tolak
        </button>
      </div>
      {appSt.message && !appSt.ok && <p className="text-[11px] text-red-600">{appSt.message}</p>}
      {showReject && (
        <form action={rejAct} className="flex w-full max-w-[260px] flex-col gap-1.5 rounded-lg border border-red-200 bg-red-50/50 p-2.5 text-left">
          <input type="hidden" name="id" value={supplierId} />
          <input
            name="reason"
            required
            minLength={3}
            placeholder="Alasan penolakan (wajib)"
            className={`${inputCls} h-[34px] text-[11.5px]`}
          />
          <button type="submit" disabled={rejPend} className={buttonClass('danger', 'sm')}>
            {rejPend ? 'Menolak…' : 'Konfirmasi Tolak'}
          </button>
          {rejSt.message && !rejSt.ok && <p className="text-[10.5px] text-red-600">{rejSt.message}</p>}
        </form>
      )}
    </div>
  );
}
