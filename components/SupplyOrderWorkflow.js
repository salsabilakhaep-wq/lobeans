'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  confirmSupplyOrderAction,
  deleteSupplyOrderAction,
  dispatchSupplyOrderAction,
  instructInspectionAction,
  markArrivedAction,
  rejectSupplyOrderAction,
  returnSupplyOrderAction,
} from '@/app/actions/supply.js';
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

export function SupplyOrderWorkflow({ order, latestShipment, latestInspection, latestReturn, latestInTrx, role }) {
  const [showReject, setShowReject] = useState(false);

  const [confSt, confAct, confPend] = useActionState(confirmSupplyOrderAction, {});
  const [rejSt, rejAct, rejPend] = useActionState(rejectSupplyOrderAction, {});
  const [dispSt, dispAct, dispPend] = useActionState(dispatchSupplyOrderAction, {});
  const [arrSt, arrAct, arrPend] = useActionState(markArrivedAction, {});
  const [instSt, instAct, instPend] = useActionState(instructInspectionAction, {});
  const [retSt, retAct, retPend] = useActionState(returnSupplyOrderAction, {});
  const [delSt, delAct, delPend] = useActionState(deleteSupplyOrderAction, {});

  /* ── 1. PENDING: Supplier konfirmasi (Confirmed) atau tolak (Rejected + alasan wajib) ── */
  if (order.status === 'pending') {
    if (role === 'supplier') {
      return (
        <div key={`pending-${order.id}`} className="space-y-4">
          <p className="text-[12.5px] leading-relaxed text-lobeans-muted">
            Tinjau daftar produk, kuantitas, dan target tanggal tiba dari Warehouse Manager. Konfirmasi kesanggupan Anda (<strong className="font-bold text-lobeans-ink">Confirmed</strong>) untuk mulai mengirimkan pesanan.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <form action={confAct}>
              <input type="hidden" name="id" value={order.id} />
              <button type="submit" disabled={confPend} className={buttonClass('primary', 'md')}>
                <Icon name="check" className="h-4 w-4" />
                {confPend ? 'Memproses…' : 'Konfirmasi Kesanggupan (Confirmed)'}
              </button>
            </form>
            <button type="button" onClick={() => setShowReject(!showReject)} className={buttonClass('danger', 'md')}>
              Tolak Pesanan
            </button>
          </div>
          <Feedback state={confSt} />

          {showReject && (
            <form action={rejAct} className="space-y-3 rounded-[12px] border border-red-200 bg-red-50/40 p-4">
              <input type="hidden" name="id" value={order.id} />
              <label className="block text-[12px] font-bold text-red-900">Alasan penolakan (wajib) *</label>
              <input name="reason" required minLength={3} placeholder="Mis. Stok panen belum mencukupi untuk kuantitas diminta" className={inputCls} />
              <button type="submit" disabled={rejPend} className={buttonClass('danger', 'md')}>
                {rejPend ? 'Menolak…' : 'Konfirmasi Penolakan'}
              </button>
              <Feedback state={rejSt} />
            </form>
          )}
        </div>
      );
    }
    if (role === 'manager') {
      return (
        <div key={`pending-mgr-${order.id}`} className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-lobeans-muted">
            Restock Order telah dikirim ke <strong className="font-bold text-lobeans-ink">{order.supplier_name}</strong> dan sedang menunggu konfirmasi dari Supplier. Selama berstatus Pending, Anda dapat menghapus pesanan ini.
          </p>
          <form action={delAct}>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="redirect_to" value="/supply-orders" />
            <button
              type="submit"
              disabled={delPend}
              onClick={(e) => {
                if (!window.confirm(`Yakin ingin menghapus permintaan pasokan ${order.order_number}?`)) e.preventDefault();
              }}
              className={buttonClass('danger', 'sm')}
            >
              <Icon name="trash" className="h-3.5 w-3.5" />
              {delPend ? 'Menghapus…' : 'Hapus PO Pending'}
            </button>
          </form>
          <Feedback state={delSt} />
        </div>
      );
    }
    return (
      <p className="text-[12.5px] text-lobeans-muted">
        Restock Order telah dikirim ke <strong className="font-bold text-lobeans-ink">{order.supplier_name}</strong> dan sedang menunggu konfirmasi dari Supplier.
      </p>
    );
  }

  /* ── REJECTED ── */
  if (order.status === 'rejected') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-900">
        <span>
          <strong className="font-bold">PO Ditolak Supplier (Rejected):</strong> {order.reject_reason}
        </span>
        {role === 'manager' && (
          <Link href="/supply-orders/new" className={buttonClass('primary', 'sm')}>
            Buat PO Baru →
          </Link>
        )}
      </div>
    );
  }

  /* ── RECEIVED (Selesai — IN Approved -> PO otomatis Received & Stok bertambah) ── */
  if (order.status === 'received') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12.5px] text-emerald-900">
        <span>
          <strong className="font-bold">Pesanan Diterima (Received).</strong> Transaksi Barang Masuk telah disetujui Manager dan stok gudang telah bertambah otomatis.
        </span>
        {latestInTrx && role !== 'supplier' && (
          <Link href={`/transactions/${latestInTrx.id}`} className="font-bold text-[#1e402b] underline">
            Lihat {latestInTrx.trx_number} →
          </Link>
        )}
      </div>
    );
  }

  /* ── RETURNED (Barang Tidak Sesuai / Rusak — Klaim Refund & Manager diarahkan buat PO baru) ── */
  if (order.status === 'returned') {
    return (
      <div className="space-y-3 rounded-[12px] border border-red-200 bg-red-50/70 p-4 text-[12.5px] text-red-950">
        <p className="font-bold text-red-800">Penerimaan Ditolak &amp; Diretur (Status PO: Returned)</p>
        <p>
          <strong>Alasan penolakan / klaim refund:</strong> {latestReturn?.reason || order.reject_reason}
        </p>
        {latestReturn?.instructions && (
          <p>
            <strong>Catatan klaim refund:</strong> {latestReturn.instructions}
          </p>
        )}
        <p className="text-[12px] text-red-900">
          {role === 'supplier'
            ? 'Manager Gudang menolak penerimaan barang ini dan mengajukan klaim refund. Silakan tindak lanjuti proses pengembalian dana sesuai catatan di atas.'
            : 'Stok gudang tidak bertambah. Klaim refund telah dikirim kepada Supplier. Apabila stok masih dibutuhkan, silakan buat Restock Order (PO) baru.'}
        </p>
        {role === 'manager' && (
          <div className="pt-1">
            <Link href="/supply-orders/new" className={buttonClass('primary', 'md')}>
              + Buat Restock Order (PO) Baru
            </Link>
          </div>
        )}
      </div>
    );
  }

  /* ── 2. CONFIRMED: Supplier langsung mengirim barang -> In Transit (+ wajib foto bukti kirim) ── */
  if (order.status === 'confirmed') {
    if (role === 'supplier') {
      return (
        <form key={`dispatch-${order.id}`} action={dispAct} className="space-y-4">
          <input type="hidden" name="supply_order_id" value={order.id} />
          <p className="text-[12.5px] text-lobeans-muted">
            Pesanan sudah Anda konfirmasi (<strong className="font-bold text-lobeans-ink">Confirmed</strong>). Saat barang mulai dikirim ke gudang, unggah <strong className="font-bold text-lobeans-ink">foto bukti kirim (wajib)</strong> dan ubah status PO menjadi <strong className="font-bold text-lobeans-ink">In Transit</strong>.
          </p>
          <input name="notes" placeholder="Catatan pengiriman / nomor kendaraan (opsional)" className={inputCls} />
          <div className="rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
            <ImageUploadField
              name="proof_image"
              label="Foto bukti kirim barang"
              hint="Unggah foto muat barang / surat jalan sebelum berangkat (JPG/PNG/WEBP)."
              required
              error={dispSt.errors?.proof_image}
            />
          </div>
          <button type="submit" disabled={dispPend} className={buttonClass('primary', 'md')}>
            <Icon name="truck" className="h-4 w-4" />
            {dispPend ? 'Mengunggah & Mengirim…' : 'Kirim Barang (In Transit)'}
          </button>
          <Feedback state={dispSt} />
        </form>
      );
    }
    return (
      <p className="text-[12.5px] text-lobeans-muted">
        Supplier telah mengonfirmasi pesanan. Menunggu Supplier mengirimkan barang ke gudang (<strong className="font-bold text-lobeans-ink">In Transit</strong>).
      </p>
    );
  }

  /* ── 3. IN TRANSIT: Supplier menyerahkan bukti foto dokumentasi kedatangan barang -> Arrived ── */
  if (order.status === 'in_transit' && latestShipment) {
    if (role === 'supplier') {
      return (
        <form key={`arrived-${latestShipment.id}`} action={arrAct} className="space-y-4">
          <input type="hidden" name="shipment_id" value={latestShipment.id} />
          <input type="hidden" name="supply_order_id" value={order.id} />
          <p className="text-[12.5px] text-lobeans-muted">
            Barang sedang dalam perjalanan (<strong className="font-mono text-lobeans-ink">{latestShipment.shipment_number}</strong>). Ketika barang tiba di lokasi gudang, serahkan <strong className="font-bold text-lobeans-ink">bukti foto dokumentasi kedatangan (wajib)</strong> kepada Manager.
          </p>
          <input name="notes" placeholder="Catatan kedatangan di pintu bongkar (opsional)" className={inputCls} />
          <div className="rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-4">
            <ImageUploadField
              name="proof_image"
              label="Foto dokumentasi kedatangan barang"
              hint="Unggah foto barang tiba di gudang untuk diserahkan kepada Manager (JPG/PNG/WEBP)."
              required
              error={arrSt.errors?.proof_image}
            />
          </div>
          <button type="submit" disabled={arrPend} className={buttonClass('primary', 'md')}>
            <Icon name="check" className="h-4 w-4" />
            {arrPend ? 'Mengunggah & Menyimpan…' : 'Serahkan Bukti Kedatangan (Arrived)'}
          </button>
          <Feedback state={arrSt} />
        </form>
      );
    }
    return (
      <p className="text-[12.5px] text-lobeans-muted">
        Barang sedang dalam perjalanan menuju gudang (<strong className="font-mono font-bold text-lobeans-ink">{latestShipment.shipment_number}</strong> · In Transit).
      </p>
    );
  }

  /* ── 4A. ARRIVED: Manager menginstruksikan Staff Gudang memeriksa fisik barang -> Inspecting ── */
  if (order.status === 'arrived' && latestShipment) {
    if (role === 'manager') {
      return (
        <form key={`instruct-${latestShipment.id}`} action={instAct} className="space-y-3">
          <input type="hidden" name="shipment_id" value={latestShipment.id} />
          <input type="hidden" name="supply_order_id" value={order.id} />
          <p className="text-[12.5px] text-lobeans-muted">
            Barang telah tiba beserta foto dokumentasi kedatangan. Instruksikan <strong className="font-bold text-lobeans-ink">Staff Gudang</strong> untuk mengecek fisik jumlah dan kondisi barang (status PO akan berubah menjadi <strong className="font-bold text-lobeans-ink">Inspecting</strong>).
          </p>
          <input name="notes" placeholder="Instruksi pemeriksaan untuk Staff (opsional)" className={inputCls} />
          <button type="submit" disabled={instPend} className={buttonClass('primary', 'md')}>
            <Icon name="check" className="h-4 w-4" />
            {instPend ? 'Mengirim instruksi…' : 'Instruksikan Staff Periksa Barang (Inspecting)'}
          </button>
          <Feedback state={instSt} />
        </form>
      );
    }
    return (
      <p className="text-[12.5px] text-lobeans-muted">
        Bukti kedatangan barang telah diterima. Menunggu Manager menginstruksikan pemeriksaan fisik kepada Staff Gudang.
      </p>
    );
  }

  /* ── 4B & 5. INSPECTING: Staff memeriksa -> Skenario 1 (Sesuai -> IN Pending -> Approved -> Received) atau Skenario 2 (Tidak Sesuai -> Returned & Refund) ── */
  if (order.status === 'inspecting' && latestShipment) {
    if (!latestInspection || latestInspection.status === 'pending') {
      if (role === 'staff') {
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-lobeans-muted">
              Manager menginstruksikan pemeriksaan fisik untuk <strong className="font-mono text-lobeans-ink">{order.order_number}</strong>. Periksa jumlah &amp; kondisi barang lalu unggah foto bukti.
            </p>
            <Link href={`/inspections/${latestShipment.id}`} className={buttonClass('primary', 'md')}>
              Buka Form Pemeriksaan Fisik →
            </Link>
          </div>
        );
      }
      return (
        <p className="text-[12.5px] text-lobeans-muted">
          Staff Gudang sedang melakukan pemeriksaan fisik barang (<strong className="font-bold text-lobeans-ink">Inspecting</strong>).
        </p>
      );
    }

    const hasPendingIn = latestInTrx && latestInTrx.status === 'pending';
    const isSesuai = latestInspection.overall_result === 'sesuai';

    if (hasPendingIn) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-indigo-200 bg-indigo-50/60 px-4 py-3.5 text-[12.5px] text-indigo-950">
          <span>
            <strong className="font-bold">Incoming Transaction Menunggu Persetujuan Manager.</strong> Staff telah mengajukan <strong>{latestInTrx.trx_number}</strong> setelah pemeriksaan Sesuai. Menyetujui transaksi ini akan menambah stok dan mengubah status PO menjadi <strong>Received</strong>.
          </span>
          {role !== 'supplier' && (
            <Link href={`/transactions/${latestInTrx.id}`} className={buttonClass('primary', 'sm')}>
              {role === 'manager' ? `Konfirmasi ${latestInTrx.trx_number} →` : `Lihat ${latestInTrx.trx_number} →`}
            </Link>
          )}
        </div>
      );
    }

    if (isSesuai) {
      if (role === 'staff') {
        return (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50/70 px-4 py-3.5">
            <p className="text-[12.5px] text-emerald-950">
              <strong className="font-bold">Pemeriksaan Fisik Sesuai!</strong> Lanjutkan dengan membuat formulir <strong>Incoming Transaction (Pending)</strong> untuk persetujuan Manager.
            </p>
            <Link href={`/transactions/new?type=IN&inspection_id=${latestInspection.id}`} className={buttonClass('primary', 'md')}>
              Buat Incoming Transaction (IN) →
            </Link>
          </div>
        );
      }
      if (role === 'manager') {
        return (
          <div className="space-y-4">
            <p className="text-[12.5px] leading-relaxed text-lobeans-muted">
              Staff telah menyelesaikan pemeriksaan dengan hasil <strong className="font-bold text-emerald-800">Sesuai</strong>. Menunggu Staff Gudang menginput formulir <strong className="font-bold text-lobeans-ink">Incoming Transaction</strong> untuk Anda setujui.
            </p>
            <button type="button" onClick={() => setShowReject(!showReject)} className={buttonClass('danger', 'sm')}>
              {showReject ? 'Batal' : 'Tolak Penerimaan (Returned) & Klaim Refund'}
            </button>
            {showReject && (
              <form key={`return-override-${latestInspection.id}`} action={retAct} className="space-y-3 rounded-[12px] border border-red-200 bg-red-50/40 p-4">
                <input type="hidden" name="inspection_id" value={latestInspection.id} />
                <input type="hidden" name="supply_order_id" value={order.id} />
                <label className="block text-[12px] font-bold text-red-900">Alasan penolakan / retur (wajib) *</label>
                <input name="decision_notes" required minLength={3} placeholder="Mis. Mutu biji tidak sesuai standar grade" className={inputCls} />
                <input name="return_instructions" placeholder="Catatan klaim refund ke Supplier (opsional)" className={inputCls} />
                <button type="submit" disabled={retPend} className={buttonClass('danger', 'md')}>
                  {retPend ? 'Memproses…' : 'Tolak Penerimaan (Returned) & Klaim Refund'}
                </button>
                <Feedback state={retSt} />
              </form>
            )}
          </div>
        );
      }
      return (
        <p className="text-[12.5px] text-lobeans-muted">
          Pemeriksaan fisik selesai dengan hasil <strong className="font-bold text-emerald-800">Sesuai</strong>. Menunggu pencatatan Barang Masuk dan persetujuan Manager.
        </p>
      );
    }

    // Skenario 2: Hasil pemeriksaan Tidak Sesuai / Rusak -> Manager tolak (Returned) & ajukan klaim refund
    if (role === 'manager') {
      return (
        <div className="space-y-4">
          <p className="text-[12.5px] leading-relaxed text-lobeans-muted">
            Staff mencatat hasil pemeriksaan <strong className="font-bold text-red-700">Tidak Sesuai / Rusak</strong>. Tolak penerimaan agar status PO berubah menjadi <strong className="font-bold text-lobeans-ink">Returned</strong> (stok tidak bertambah) dan ajukan klaim refund kepada Supplier.
          </p>
          <form key={`return-${latestInspection.id}`} action={retAct} className="space-y-3 rounded-[12px] border border-red-200 bg-red-50/40 p-4">
            <input type="hidden" name="inspection_id" value={latestInspection.id} />
            <input type="hidden" name="supply_order_id" value={order.id} />
            <label className="block text-[12px] font-bold text-red-900">Alasan penolakan / retur (wajib) *</label>
            <input
              name="decision_notes"
              required
              minLength={3}
              placeholder="Mis. Kuantitas aktual kurang atau mutu biji kopi rusak / berjamur"
              className={inputCls}
            />
            <input
              name="return_instructions"
              placeholder="Catatan klaim refund / pengembalian ke Supplier (opsional)"
              className={inputCls}
            />
            <button type="submit" disabled={retPend} className={buttonClass('danger', 'md')}>
              {retPend ? 'Memproses…' : 'Tolak Penerimaan (Returned) & Ajukan Refund'}
            </button>
            <Feedback state={retSt} />
          </form>
        </div>
      );
    }
    return (
      <p className="text-[12.5px] text-red-800">
        Hasil pemeriksaan fisik <strong className="font-bold">Tidak Sesuai</strong>. Menunggu keputusan Manager Gudang untuk proses retur &amp; klaim refund.
      </p>
    );
  }

  return null;
}
