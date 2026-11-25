'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { APP_CONFIG } from '@/lib/appConfig.js';
import { requireUser } from '@/lib/auth.js';
import { fail, formToObject, parseItems, parsePositiveInt, run, safeInternalPath, success } from '@/lib/form.js';
import { removeImage, saveImage } from '@/lib/upload.js';
import { parse, reasonSchema, supplyOrderSchema } from '@/lib/validation.js';
import {
  createSupplyOrder,
  decideSupplyOrder,
  deletePendingSupplyOrder,
  dispatchSupplyOrder,
  instructInspection,
  markShipmentArrived,
  returnSupplyOrder,
  submitInspection,
} from '@/lib/services/supply.js';

export async function createSupplyOrderAction(_prev, formData) {
  const user = await requireUser(['manager']);
  const parsed = parse(supplyOrderSchema, formToObject(formData));
  const { items, error: itemsErr } = parseItems(formData.get('items'));
  if (!parsed.ok || itemsErr) {
    return fail('Periksa kembali isian Restock Order (PO).', { ...parsed.errors, ...(itemsErr ? { items: itemsErr } : {}) }, formData);
  }
  return run(async () => {
    const id = await createSupplyOrder(user, { ...parsed.data, items });
    revalidatePath('/supply-orders');
    revalidatePath('/dashboard');
    redirect(`/supply-orders/${id}?ok=` + encodeURIComponent('Restock Order (PO) berhasil dikirim ke Supplier.'));
  }, formData);
}

export async function confirmSupplyOrderAction(_prev, formData) {
  const user = await requireUser(['supplier']);
  const id = parsePositiveInt(formData.get('id'));
  if (!id) return fail('ID pesanan pasokan tidak valid.');
  return run(async () => {
    await decideSupplyOrder(user, id, 'confirm');
    revalidatePath('/supply-orders');
    revalidatePath(`/supply-orders/${id}`);
    revalidatePath('/shipments');
    revalidatePath('/dashboard');
    return success('Restock Order (PO) dikonfirmasi. Anda dapat langsung mengirim barang (In Transit).');
  }, formData);
}

export async function rejectSupplyOrderAction(_prev, formData) {
  const user = await requireUser(['supplier']);
  const id = parsePositiveInt(formData.get('id'));
  if (!id) return fail('ID pesanan pasokan tidak valid.', {}, formData);
  const parsed = parse(reasonSchema, formToObject(formData));
  if (!parsed.ok) return fail(parsed.errors.reason, parsed.errors, formData);
  return run(async () => {
    await decideSupplyOrder(user, id, 'reject', parsed.data.reason);
    revalidatePath('/supply-orders');
    revalidatePath(`/supply-orders/${id}`);
    revalidatePath('/dashboard');
    return success('Restock Order (PO) ditolak.');
  }, formData);
}

export async function dispatchSupplyOrderAction(_prev, formData) {
  const user = await requireUser(['supplier']);
  const orderId = parsePositiveInt(formData.get('supply_order_id'));
  if (!orderId) return fail('ID pesanan pasokan tidak valid.', {}, formData);
  const notes = String(formData.get('notes') || '');

  const img = await saveImage(formData.get('proof_image'), { required: true });
  if (img.error) {
    return fail('Foto bukti kirim wajib diunggah sebelum mengubah status ke In Transit.', { proof_image: 'Foto bukti kirim wajib diunggah.' }, formData);
  }

  return run(async () => {
    try {
      await dispatchSupplyOrder(user, orderId, img.url, notes);
    } catch (err) {
      await removeImage(img.url);
      throw err;
    }
    revalidatePath('/supply-orders');
    revalidatePath(`/supply-orders/${orderId}`);
    revalidatePath('/shipments');
    revalidatePath('/dashboard');
    return success('Barang dikirim! Status PO diperbarui menjadi In Transit disertai bukti kirim.');
  }, formData);
}

export async function markArrivedAction(_prev, formData) {
  const user = await requireUser(['supplier']);
  const shipmentId = parsePositiveInt(formData.get('shipment_id'));
  const orderId = parsePositiveInt(formData.get('supply_order_id'));
  if (!shipmentId || !orderId) return fail('ID pengiriman tidak valid.', {}, formData);
  const notes = String(formData.get('notes') || '');

  const img = await saveImage(formData.get('proof_image'), { required: true });
  if (img.error) {
    return fail('Foto bukti dokumentasi kedatangan barang wajib diunggah.', { proof_image: 'Foto bukti kedatangan wajib diunggah.' }, formData);
  }

  return run(async () => {
    try {
      await markShipmentArrived(user, shipmentId, img.url, notes);
    } catch (err) {
      await removeImage(img.url);
      throw err;
    }
    revalidatePath('/supply-orders');
    revalidatePath(`/supply-orders/${orderId}`);
    revalidatePath('/shipments');
    revalidatePath('/dashboard');
    return success('Bukti foto kedatangan diserahkan ke Manager. Menunggu instruksi pemeriksaan fisik.');
  }, formData);
}

export async function instructInspectionAction(_prev, formData) {
  const user = await requireUser(['manager']);
  const shipmentId = parsePositiveInt(formData.get('shipment_id'));
  const orderId = parsePositiveInt(formData.get('supply_order_id'));
  if (!shipmentId || !orderId) return fail('ID pengiriman tidak valid.', {}, formData);
  const notes = String(formData.get('notes') || '');
  return run(async () => {
    await instructInspection(user, shipmentId, notes);
    revalidatePath('/supply-orders');
    revalidatePath(`/supply-orders/${orderId}`);
    revalidatePath('/shipments');
    revalidatePath('/inspections');
    revalidatePath('/dashboard');
    return success('Instruksi pemeriksaan dikirim ke Staff Gudang (Status PO: Inspecting).');
  }, formData);
}

export async function submitInspectionAction(_prev, formData) {
  const user = await requireUser(['staff']);
  const shipmentId = parsePositiveInt(formData.get('shipment_id'));
  const orderId = parsePositiveInt(formData.get('supply_order_id'));
  if (!shipmentId || !orderId) return fail('ID pengiriman tidak valid.', {}, formData);
  const notes = String(formData.get('notes') || '').trim();
  const photoCaption = String(formData.get('photo_caption') || '');

  if (notes.length < 5) {
    return fail('Catatan ringkasan pemeriksaan wajib diisi minimal 5 karakter.', { notes: 'Minimal 5 karakter' }, formData);
  }

  let items = [];
  try {
    items = JSON.parse(String(formData.get('inspection_items') || '[]'));
  } catch {
    return fail('Data item pemeriksaan tidak valid.', {}, formData);
  }

  const img = await saveImage(formData.get('photo'), { required: true });
  if (img.error) return fail('Foto bukti pemeriksaan wajib diunggah.', { photo: img.error }, formData);

  return run(async () => {
    let res;
    try {
      res = await submitInspection(user, shipmentId, { items, notes, photoUrl: img.url, photoCaption });
    } catch (err) {
      await removeImage(img.url);
      throw err;
    }
    revalidatePath('/inspections');
    revalidatePath(`/inspections/${shipmentId}`);
    revalidatePath(`/supply-orders/${orderId}`);
    revalidatePath('/transactions/in');
    revalidatePath('/dashboard');

    if (res.overallResult === 'sesuai') {
      redirect(
        `/transactions/new?type=IN&inspection_id=${res.inspectionId}&ok=` +
          encodeURIComponent('Pemeriksaan selesai dengan hasil Sesuai! Lengkapi formulir Incoming Transaction untuk diajukan ke Manager.'),
      );
    }
    redirect(
      `/inspections?ok=` +
        encodeURIComponent('Laporan pemeriksaan (Tidak Sesuai) beserta foto bukti berhasil dikirim ke Manager Gudang.'),
    );
  }, formData);
}

export async function returnSupplyOrderAction(_prev, formData) {
  const user = await requireUser(['manager']);
  const inspectionId = parsePositiveInt(formData.get('inspection_id'));
  const orderId = parsePositiveInt(formData.get('supply_order_id'));
  if (!inspectionId || !orderId) return fail('ID pemeriksaan tidak valid.', {}, formData);
  const reason = String(formData.get('decision_notes') || '');
  const instructions = String(formData.get('return_instructions') || '');

  return run(async () => {
    await returnSupplyOrder(user, inspectionId, reason, instructions);
    revalidatePath('/supply-orders');
    revalidatePath(`/supply-orders/${orderId}`);
    revalidatePath('/shipments');
    revalidatePath('/inspections');
    revalidatePath('/transactions/in');
    revalidatePath('/dashboard');
    return success('Penerimaan ditolak (Status PO: Returned) & klaim refund diajukan ke Supplier. Stok gudang tidak berubah.');
  }, formData);
}

export async function deleteSupplyOrderAction(_prev, formData) {
  const user = await requireUser(['manager']);
  const id = parsePositiveInt(formData.get('id'));
  if (!id) return fail('ID pesanan pasokan tidak valid.');
  const redirectTo = safeInternalPath(
    formData.get('redirect_to'),
    APP_CONFIG.security.allowedDeleteSupplyRedirects,
  );
  return run(async () => {
    const orderNumber = await deletePendingSupplyOrder(user, id);
    revalidatePath('/supply-orders');
    revalidatePath('/dashboard');
    if (redirectTo) {
      redirect(`${redirectTo}?ok=` + encodeURIComponent(`Permintaan pasokan ${orderNumber} berhasil dihapus.`));
    }
    return success(`Permintaan pasokan ${orderNumber} berhasil dihapus.`);
  }, formData);
}
