'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { withTransaction } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { logActivity } from '@/lib/audit.js';
import { AppError } from '@/lib/errors.js';
import { fail, formToObject, run, success } from '@/lib/form.js';
import { saveImage } from '@/lib/upload.js';
import { parse, userCreateSchema, userUpdateSchema } from '@/lib/validation.js';

const done = (msg) => redirect('/users?ok=' + encodeURIComponent(msg));

export async function createUserAction(_prev, formData) {
  const actor = await requireUser(['admin']);
  const parsed = parse(userCreateSchema, formToObject(formData));

  const rawRole = String(formData.get('role') || '');
  const rawMode = String(formData.get('supplier_mode') || 'new');
  const needsDoc = rawRole === 'supplier' && rawMode === 'new';
  const doc = needsDoc ? await saveImage(formData.get('document'), { required: true }) : { url: null, error: null };

  if (!parsed.ok || doc.error) {
    const docErr = doc.error ? 'Dokumen profil / legalitas supplier wajib diunggah.' : undefined;
    return fail(
      docErr || 'Periksa kembali isian pengguna.',
      { ...parsed.errors, ...(docErr ? { document: docErr } : {}) },
      formData,
    );
  }
  const d = parsed.data;

  return run(async () => {
    await withTransaction(async (client) => {
      const roleRow = await client.query('SELECT id FROM roles WHERE code = $1', [d.role]);
      if (!roleRow.rows[0]) throw new AppError('Role tidak ditemukan.', 'role');

      let supplierId = null;
      if (d.role === 'supplier') {
        if (d.supplier_mode === 'existing') {
          supplierId = Number(d.supplier_id);
          const supCheck = await client.query('SELECT id FROM suppliers WHERE id = $1', [supplierId]);
          if (!supCheck.rows[0]) throw new AppError('Profil Supplier tidak ditemukan.', 'supplier_id');
        } else {
          const codeRes = await client.query('SELECT COALESCE(MAX(id), 0)::int + 1 AS next_num FROM suppliers');
          const supplierCode = `SUP-${String(codeRes.rows[0].next_num).padStart(3, '0')}`;
          try {
            const supIns = await client.query(
              `INSERT INTO suppliers (supplier_code, company_name, contact_name, phone, email, address, document_url, verification_status, verified_by, verified_at, is_active)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8, NOW(), TRUE)
               RETURNING id`,
              [supplierCode, d.company_name, d.name, d.phone, d.email, d.address, doc.url, actor.id],
            );
            supplierId = supIns.rows[0].id;
          } catch (err) {
            if (err.code === '23505') {
              throw new AppError('Email atau kode supplier sudah terdaftar.', 'email');
            }
            throw err;
          }
        }
      }

      const hash = await bcrypt.hash(d.password, 10);
      try {
        const ins = await client.query(
          `INSERT INTO users (role_id, supplier_id, name, email, password_hash, is_active)
           VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
          [roleRow.rows[0].id, supplierId, d.name, d.email, hash],
        );
        await logActivity(client, {
          actor,
          action: 'create_user',
          entityType: 'user',
          entityId: ins.rows[0].id,
          summary: `Admin menambahkan akun ${d.name} (${d.email}) dengan role ${d.role}.`,
        });
      } catch (err) {
        if (err.code === '23505') {
          if (String(err.constraint).includes('supplier')) {
            throw new AppError('Profil Supplier tersebut sudah terhubung ke akun lain.', 'supplier_id');
          }
          throw new AppError('Email sudah terdaftar.', 'email');
        }
        throw err;
      }
    });
    revalidatePath('/users');
    revalidatePath('/suppliers');
    revalidatePath('/dashboard');
    done(`Akun ${d.name} (${d.role}) berhasil ditambahkan.`);
  }, formData);
}

export async function updateUserAction(id, _prev, formData) {
  const actor = await requireUser(['admin']);
  const parsed = parse(userUpdateSchema, formToObject(formData));
  if (!parsed.ok) return fail('Periksa kembali isian pengguna.', parsed.errors, formData);
  const d = parsed.data;

  return run(async () => {
    const isActive = d.is_active === 'true';
    if (Number(id) === actor.id && (d.role !== 'admin' || !isActive)) {
      throw new AppError('Anda tidak dapat menurunkan role atau menonaktifkan akun sendiri.', 'role');
    }
    await withTransaction(async (client) => {
      const roleRow = await client.query('SELECT id FROM roles WHERE code = $1', [d.role]);
      if (!roleRow.rows[0]) throw new AppError('Role tidak valid.', 'role');
      try {
        const res = d.password
          ? await client.query(
              `UPDATE users SET name=$1, email=$2, role_id=$3, is_active=$4, password_hash=$5, updated_at=NOW() WHERE id=$6`,
              [d.name, d.email, roleRow.rows[0].id, isActive, await bcrypt.hash(d.password, 10), id],
            )
          : await client.query(
              `UPDATE users SET name=$1, email=$2, role_id=$3, is_active=$4, updated_at=NOW() WHERE id=$5`,
              [d.name, d.email, roleRow.rows[0].id, isActive, id],
            );
        if (res.rowCount === 0) throw new AppError('Pengguna tidak ditemukan.');
      } catch (err) {
        if (err.code === '23505') throw new AppError('Email sudah dipakai pengguna lain.', 'email');
        throw err;
      }
      await logActivity(client, {
        actor,
        action: 'update_user',
        entityType: 'user',
        entityId: Number(id),
        summary: `Admin memperbarui akun ${d.name} (role: ${d.role}, aktif: ${isActive}).`,
      });
    });
    revalidatePath('/users');
    done('Data pengguna berhasil diperbarui.');
  }, formData);
}

export async function toggleUserActiveAction(_prev, formData) {
  const actor = await requireUser(['admin']);
  const id = Number(formData.get('id'));
  const nextActive = formData.get('next_active') === 'true';
  return run(async () => {
    if (id === actor.id && !nextActive) throw new AppError('Tidak dapat menonaktifkan akun sendiri.');
    await withTransaction(async (client) => {
      const res = await client.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING name', [
        nextActive,
        id,
      ]);
      if (res.rowCount === 0) throw new AppError('Pengguna tidak ditemukan.');
      await logActivity(client, {
        actor,
        action: nextActive ? 'activate_user' : 'deactivate_user',
        entityType: 'user',
        entityId: id,
        summary: `Admin ${nextActive ? 'mengaktifkan' : 'menonaktifkan'} akun ${res.rows[0].name}.`,
      });
    });
    revalidatePath('/users');
    return success(nextActive ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.');
  }, formData);
}
