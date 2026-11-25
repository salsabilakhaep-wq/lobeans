'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { withTransaction } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { logActivity } from '@/lib/audit.js';
import { AppError } from '@/lib/errors.js';
import { fail, formToObject, run, success } from '@/lib/form.js';
import { saveImage } from '@/lib/upload.js';
import { parse, reasonSchema, supplierSchema } from '@/lib/validation.js';

const done = (msg) => redirect('/suppliers?ok=' + encodeURIComponent(msg));

export async function createSupplierAction(_prev, formData) {
  const actor = await requireUser(['admin']);
  const parsed = parse(supplierSchema, formToObject(formData));
  const img = await saveImage(formData.get('document'), { required: true });
  if (!parsed.ok || img.error) {
    const docErr = img.error ? 'Dokumen verifikasi supplier wajib diunggah.' : undefined;
    return fail(
      docErr || 'Periksa kembali data supplier.',
      { ...parsed.errors, ...(docErr ? { document: docErr } : {}) },
      formData,
    );
  }
  const d = parsed.data;
  return run(async () => {
    await withTransaction(async (client) => {
      try {
        const ins = await client.query(
          `INSERT INTO suppliers (supplier_code, company_name, contact_name, phone, email, address, document_url, verification_status, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'approved',TRUE) RETURNING id`,
          [d.supplier_code, d.company_name, d.contact_name, d.phone, d.email, d.address, img.url],
        );
        await logActivity(client, {
          actor,
          action: 'create_supplier',
          entityType: 'supplier',
          entityId: ins.rows[0].id,
          summary: `Admin menambahkan profil Supplier ${d.company_name} (${d.supplier_code}).`,
        });
      } catch (err) {
        if (err.code === '23505') throw new AppError('Kode supplier sudah dipakai.', 'supplier_code');
        throw err;
      }
    });
    revalidatePath('/suppliers');
    revalidatePath('/dashboard');
    done(`Supplier ${d.company_name} berhasil ditambahkan.`);
  }, formData);
}

export async function updateSupplierAction(id, _prev, formData) {
  const actor = await requireUser(['admin']);
  const parsed = parse(supplierSchema, formToObject(formData));
  const img = await saveImage(formData.get('document'), { required: false });
  if (!parsed.ok || img.error) {
    return fail(img.error || 'Periksa kembali data supplier.', { ...parsed.errors, ...(img.error ? { document: img.error } : {}) }, formData);
  }
  const d = parsed.data;
  return run(async () => {
    await withTransaction(async (client) => {
      try {
        const res = await client.query(
          `UPDATE suppliers
              SET supplier_code=$1, company_name=$2, contact_name=$3, phone=$4, email=$5, address=$6,
                  document_url=COALESCE($7, document_url), updated_at=NOW()
            WHERE id=$8`,
          [d.supplier_code, d.company_name, d.contact_name, d.phone, d.email, d.address, img.url, id],
        );
        if (res.rowCount === 0) throw new AppError('Supplier tidak ditemukan.');
        await logActivity(client, {
          actor,
          action: 'update_supplier',
          entityType: 'supplier',
          entityId: Number(id),
          summary: `Admin memperbarui profil Supplier ${d.company_name}.`,
        });
      } catch (err) {
        if (err.code === '23505') throw new AppError('Kode supplier sudah dipakai.', 'supplier_code');
        throw err;
      }
    });
    revalidatePath('/suppliers');
    done('Data supplier berhasil diperbarui.');
  }, formData);
}

export async function approveSupplierAction(_prev, formData) {
  const actor = await requireUser(['admin']);
  const id = Number(formData.get('id'));
  return run(async () => {
    await withTransaction(async (client) => {
      const res = await client.query(
        `UPDATE suppliers
            SET verification_status = 'approved', reject_reason = NULL, is_active = TRUE, updated_at = NOW()
          WHERE id = $1
          RETURNING company_name`,
        [id],
      );
      if (res.rowCount === 0) throw new AppError('Supplier tidak ditemukan.');
      await client.query('UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE supplier_id = $1', [id]);
      await logActivity(client, {
        actor,
        action: 'approve_supplier',
        entityType: 'supplier',
        entityId: id,
        summary: `Admin menyetujui pendaftaran Supplier ${res.rows[0].company_name}.`,
      });
    });
    revalidatePath('/suppliers');
    revalidatePath('/dashboard');
    return success('Supplier disetujui dan akunnya kini aktif.');
  }, formData);
}

export async function rejectSupplierAction(_prev, formData) {
  const actor = await requireUser(['admin']);
  const id = Number(formData.get('id'));
  const parsed = parse(reasonSchema, formToObject(formData));
  if (!parsed.ok) return fail(parsed.errors.reason, parsed.errors, formData);
  return run(async () => {
    await withTransaction(async (client) => {
      const res = await client.query(
        `UPDATE suppliers
            SET verification_status = 'rejected', reject_reason = $1, is_active = FALSE, updated_at = NOW()
          WHERE id = $2
          RETURNING company_name`,
        [parsed.data.reason, id],
      );
      if (res.rowCount === 0) throw new AppError('Supplier tidak ditemukan.');
      await client.query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE supplier_id = $1', [id]);
      await logActivity(client, {
        actor,
        action: 'reject_supplier',
        entityType: 'supplier',
        entityId: id,
        summary: `Admin menolak pendaftaran Supplier ${res.rows[0].company_name}: ${parsed.data.reason}`,
      });
    });
    revalidatePath('/suppliers');
    revalidatePath('/dashboard');
    return success('Pendaftaran supplier ditolak.');
  }, formData);
}

export async function toggleSupplierActiveAction(_prev, formData) {
  const actor = await requireUser(['admin']);
  const id = Number(formData.get('id'));
  const nextActive = formData.get('next_active') === 'true';
  return run(async () => {
    await withTransaction(async (client) => {
      const res = await client.query(
        'UPDATE suppliers SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING company_name',
        [nextActive, id],
      );
      if (res.rowCount === 0) throw new AppError('Supplier tidak ditemukan.');
      await client.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE supplier_id = $2', [nextActive, id]);
      await logActivity(client, {
        actor,
        action: nextActive ? 'activate_supplier' : 'deactivate_supplier',
        entityType: 'supplier',
        entityId: id,
        summary: `Admin ${nextActive ? 'mengaktifkan' : 'menonaktifkan'} Supplier ${res.rows[0].company_name}.`,
      });
    });
    revalidatePath('/suppliers');
    revalidatePath('/dashboard');
    return success(nextActive ? 'Supplier diaktifkan.' : 'Supplier dinonaktifkan.');
  }, formData);
}
