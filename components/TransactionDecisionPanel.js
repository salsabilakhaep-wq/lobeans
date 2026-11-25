'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  approveTransactionAction,
  deletePendingTransactionAction,
  rejectTransactionAction,
  shipOutgoingAction,
} from '@/app/actions/transactions.js';
import { Icon } from './icons.js';
import { ImageUploadField } from './ImageUploadField.js';
import { buttonClass, inputCls } from './styles.js';

function Feedback({ state }) {
  if (!state?.message) return null;
  return (
    <div
      role="alert"
      className={`mt-3 flex items-start gap-2 rounded-[10px] border px-3.5 py-2.5 text-[12px] font-medium ${
        state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'
      }`}
    >
      <Icon name={state.ok ? 'check' : 'alert'} className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{state.message}</span>
    </div>
  );
}

export function TransactionDecisionPanel({ trx, user }) {
  const [showReject, setShowReject] = useState(false);
  const [appSt, appAct, appPend] = useActionState(approveTransactionAction, {});
  const [rejSt, rejAct, rejPend] = useActionState(rejectTransactionAction, {});
  const [shipSt, shipAct, shipPend] = useActionState(shipOutgoingAction, {});
  const [delSt, delAct, delPend] = useActionState(deletePendingTransactionAction, {});

  /* ── 1. MANAGER: Setujui atau Tolak transaksi Pending ── */
  if (user.role === 'manager' && trx.status === 'pending') {
    return (
      <div className="space-y-4">
        <p className="text-[12.5px] leading-relaxed text-lobeans-muted">
          {trx.type === 'IN'
            ? 'Menyetujui Incoming Transaction ini akan otomatis menambah saldo stok gudang dan mengubah status PO terkait menjadi Received.'
            : 'Menyetujui Outgoing Transaction ini memberi lampu hijau bagi Staff Gudang untuk melakukan packing. Stok baru akan berkurang saat Staff mengirim barang (Shipped).'}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <form action={appAct}>
            <input type="hidden" name="id" value={trx.id} />
            <input type="hidden" name="type" value={trx.type} />
            <button type="submit" disabled={appPend} className={buttonClass('primary', 'md')}>
              <Icon name="check" className="h-4 w-4" />
              {appPend ? 'Memproses…' : `Setujui ${trx.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar'} (Approve)`}
            </button>
          </form>
          <button type="button" onClick={() => setShowReject(!showReject)} className={buttonClass('danger', 'md')}>
            Tolak Transaksi
          </button>
        </div>
        <Feedback state={appSt} />

        {showReject && (
          <form action={rejAct} className="space-y-3 rounded-[12px] border border-red-200 bg-red-50/40 p-4">
            <input type="hidden" name="id" value={trx.id} />
            <label className="block text-[12px] font-bold text-red-900">Alasan penolakan (wajib) *</label>
            <input name="reason" required minLength={3} placeholder="Tuliskan alasan penolakan transaksi" className={inputCls} />
            <button type="submit" disabled={rejPend} className={buttonClass('danger', 'md')}>
              {rejPend ? 'Menolak…' : 'Konfirmasi Penolakan'}
            </button>
            <Feedback state={rejSt} />
          </form>
        )}
      </div>
    );
  }

  /* ── 2. STAFF: Packing & Kirim Barang OUT Approved -> Shipped (Stok berkurang saat Shipped!) ── */
  if (user.role === 'staff' && trx.type === 'OUT' && trx.status === 'approved') {
    return (
      <form key={`ship-out-${trx.id}`} action={shipAct} className="space-y-4">
        <input type="hidden" name="id" value={trx.id} />
        <p className="text-[12.5px] leading-relaxed text-lobeans-muted">
          Pengajuan telah disetujui Manager. Ambil barang dari rak, lakukan packing untuk <strong className="font-bold text-lobeans-ink">{trx.recipient_name}</strong>, lalu unggah <strong className="font-bold text-lobeans-ink">foto bukti pengiriman (wajib)</strong> dan tekan tombol <strong className="font-bold text-lobeans-ink">Kirim Barang (Shipped)</strong>. Saldo stok gudang akan langsung berkurang saat barang dikirim.
        </p>
        <div className="rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
          <ImageUploadField
            name="proof_image"
            label="Foto bukti pengiriman barang"
            hint="Unggah foto barang siap kirim / serah terima (JPG/PNG/WEBP)."
            required
            error={shipSt.errors?.proof_image}
          />
        </div>
        <button type="submit" disabled={shipPend} className={buttonClass('primary', 'md')}>
          <Icon name="truck" className="h-4 w-4" />
          {shipPend ? 'Mengunggah & Memproses…' : 'Kirim Barang (Shipped)'}
        </button>
        <Feedback state={shipSt} />
      </form>
    );
  }

  /* ── 3. STAFF: Transaksi Pending miliknya sendiri (bisa diedit atau dihapus) ── */
  if (user.role === 'staff' && trx.status === 'pending' && trx.created_by === user.id) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12.5px] text-lobeans-muted">
          Transaksi sedang menunggu persetujuan Manager Gudang. Selama berstatus Pending, Anda masih dapat mengubah atau menghapus transaksi ini.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {trx.type === 'OUT' && (
            <Link href={`/transactions/${trx.id}/edit`} className={buttonClass('secondary', 'sm')}>
              Ubah Transaksi
            </Link>
          )}
          <form action={delAct}>
            <input type="hidden" name="id" value={trx.id} />
            <button type="submit" disabled={delPend} className={buttonClass('danger', 'sm')}>
              {delPend ? 'Menghapus…' : 'Hapus Transaksi'}
            </button>
          </form>
        </div>
        <Feedback state={delSt} />
      </div>
    );
  }

  if (trx.status === 'approved') {
    return (
      <p className="text-[12.5px] font-medium text-emerald-800">
        {trx.type === 'IN'
          ? '✓ Incoming Transaction telah disetujui Manager. Stok gudang telah bertambah otomatis dan status PO menjadi Received.'
          : '✓ Outgoing Transaction telah disetujui Manager. Menunggu Staff melakukan packing dan mengirim barang (Shipped) agar stok dikurangi.'}
      </p>
    );
  }
  if (trx.status === 'shipped') {
    return (
      <p className="text-[12.5px] font-medium text-sky-900">
        ✓ Barang keluar telah dikirim (<strong className="font-bold">Shipped</strong>) ke {trx.recipient_name} dan stok gudang telah berkurang sesuai kuantitas transaksi.
      </p>
    );
  }
  if (trx.status === 'rejected') {
    return (
      <p className="text-[12.5px] font-medium text-red-800">
        Transaksi ditolak — stok tidak berubah. Alasan: <strong className="font-bold">{trx.reject_reason}</strong>
      </p>
    );
  }
  return <p className="text-[12.5px] text-lobeans-muted">Menunggu persetujuan dari Manager Gudang.</p>;
}
