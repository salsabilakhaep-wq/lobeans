'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth.js';
import { fail, formToObject, parseItems, run } from '@/lib/form.js';
import { saveImage } from '@/lib/upload.js';
import { incomingSchema, outgoingSchema, parse, reasonSchema } from '@/lib/validation.js';
import {
  createIncomingTransaction,
  createOutgoingTransaction,
  decideTransaction,
  deletePendingTransaction,
  shipOutgoingTransaction,
  updateOutgoingTransaction,
} from '@/lib/services/transactions.js';

export async function createIncomingAction(_prev, formData) {
  const user = await requireUser(['staff']);
  const parsed = parse(incomingSchema, formToObject(formData));
  if (!parsed.ok) {
    return fail('Periksa kembali isian catatan barang masuk.', parsed.errors, formData);
  }
  return run(async () => {
    const id = await createIncomingTransaction(user, parsed.data);
    revalidatePath('/transactions/in');
    revalidatePath('/inspections');
    revalidatePath('/supply-orders');
    revalidatePath('/dashboard');
    redirect(`/transactions/${id}?ok=` + encodeURIComponent('Incoming Transaction (Pending) berhasil diajukan untuk persetujuan Manager.'));
  }, formData);
}

export async function createOutgoingAction(_prev, formData) {
  const user = await requireUser(['staff']);
  const parsed = parse(outgoingSchema, formToObject(formData));
  const { items, error: itemsErr } = parseItems(formData.get('items'));
  if (!parsed.ok || itemsErr) {
    return fail(
      'Periksa kembali isian transaksi barang keluar.',
      { ...parsed.errors, ...(itemsErr ? { items: itemsErr } : {}) },
      formData,
    );
  }
  return run(async () => {
    const id = await createOutgoingTransaction(user, { ...parsed.data, items });
    revalidatePath('/transactions/out');
    revalidatePath('/dashboard');
    redirect(`/transactions/${id}?ok=` + encodeURIComponent('Outgoing Transaction (Pending) berhasil diajukan ke Manager.'));
  }, formData);
}

export async function updateOutgoingAction(id, _prev, formData) {
  const user = await requireUser(['staff']);
  const parsed = parse(outgoingSchema, formToObject(formData));
  const { items, error: itemsErr } = parseItems(formData.get('items'));
  if (!parsed.ok || itemsErr) {
    return fail(
      'Periksa kembali perubahan transaksi barang keluar.',
      { ...parsed.errors, ...(itemsErr ? { items: itemsErr } : {}) },
      formData,
    );
  }
  return run(async () => {
    await updateOutgoingTransaction(user, Number(id), { ...parsed.data, items });
    revalidatePath('/transactions/out');
    revalidatePath(`/transactions/${id}`);
    revalidatePath('/dashboard');
    redirect(`/transactions/${id}?ok=` + encodeURIComponent('Perubahan transaksi Pending berhasil disimpan.'));
  }, formData);
}

export async function approveTransactionAction(_prev, formData) {
  const user = await requireUser(['manager']);
  const id = Number(formData.get('id'));
  const type = String(formData.get('type') || '');
  return run(async () => {
    await decideTransaction(user, id, 'approve');
    revalidatePath('/transactions/in');
    revalidatePath('/transactions/out');
    revalidatePath(`/transactions/${id}`);
    revalidatePath('/supply-orders');
    revalidatePath('/shipments');
    revalidatePath('/inspections');
    revalidatePath('/products');
    revalidatePath('/reports');
    revalidatePath('/dashboard');
    const msg =
      type === 'OUT'
        ? 'Transaksi Barang Keluar disetujui (Approved). Staff siap packing; stok akan berkurang saat barang dikirim (Shipped).'
        : 'Transaksi Barang Masuk disetujui (Approved). Stok gudang bertambah otomatis dan status PO menjadi Received.';
    redirect(`/transactions/${id}?ok=` + encodeURIComponent(msg));
  }, formData);
}

export async function rejectTransactionAction(_prev, formData) {
  const user = await requireUser(['manager']);
  const id = Number(formData.get('id'));
  const parsed = parse(reasonSchema, formToObject(formData));
  if (!parsed.ok) return fail(parsed.errors.reason, parsed.errors, formData);
  return run(async () => {
    await decideTransaction(user, id, 'reject', parsed.data.reason);
    revalidatePath('/transactions/in');
    revalidatePath('/transactions/out');
    revalidatePath(`/transactions/${id}`);
    revalidatePath('/supply-orders');
    revalidatePath('/dashboard');
    redirect(`/transactions/${id}?ok=` + encodeURIComponent('Transaksi ditolak — saldo stok tidak berubah.'));
  }, formData);
}

export async function shipOutgoingAction(_prev, formData) {
  const user = await requireUser(['staff']);
  const id = Number(formData.get('id'));
  const img = await saveImage(formData.get('proof_image'), { required: true });
  if (img.error) return fail('Foto bukti pengiriman wajib diunggah untuk mengubah status ke Shipped.', { proof_image: img.error }, formData);
  return run(async () => {
    await shipOutgoingTransaction(user, id, img.url);
    revalidatePath('/transactions/out');
    revalidatePath(`/transactions/${id}`);
    revalidatePath('/products');
    revalidatePath('/reports');
    revalidatePath('/dashboard');
    redirect(`/transactions/${id}?ok=` + encodeURIComponent('Barang berhasil dikirim (Shipped) — saldo stok gudang telah dikurangi otomatis.'));
  }, formData);
}

export async function deletePendingTransactionAction(_prev, formData) {
  const user = await requireUser(['staff', 'manager']);
  const id = Number(formData.get('id'));
  return run(async () => {
    const type = await deletePendingTransaction(user, id);
    revalidatePath('/transactions/in');
    revalidatePath('/transactions/out');
    revalidatePath('/inspections');
    revalidatePath('/dashboard');
    const target = type === 'IN' ? '/transactions/in' : '/transactions/out';
    redirect(`${target}?ok=` + encodeURIComponent('Transaksi Pending berhasil dihapus.'));
  }, formData);
}
