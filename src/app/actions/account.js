'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { withTransaction } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { logActivity } from '@/lib/audit.js';
import { AppError } from '@/lib/errors.js';
import { fail, formToObject, run, success } from '@/lib/form.js';
import { saveImage } from '@/lib/upload.js';
import { parse, supplierAccountProfileSchema, supplierChangePasswordSchema } from '@/lib/validation.js';

export async function updateSupplierProfileAction(_prev, formData) {
  const user = await requireUser(['supplier']);
  if (!user.supplier_id) {
    return fail('Data mitra supplier tidak ditemukan pada akun Anda.');
  }

  const parsed = parse(supplierAccountProfileSchema, formToObject(formData));
  const doc = await saveImage(formData.get('document'), { required: false });
  if (!parsed.ok || doc.error) {
    return fail(
      doc.error || 'Periksa kembali data profil dan usaha Anda.',
      { ...parsed.errors, ...(doc.error ? { document: doc.error } : {}) },
      formData,
    );
  }

  const d = parsed.data;
  return run(async () => {
    await withTransaction(async (client) => {
      try {
        await client.query(
          `UPDATE users
              SET name = $1, email = $2, updated_at = NOW()
            WHERE id = $3`,
          [d.contact_name, d.email, user.id],
        );
        await client.query(
          `UPDATE suppliers
              SET company_name = $1,
                  contact_name = $2,
                  phone = $3,
                  email = $4,
                  address = $5,
                  document_url = COALESCE($6, document_url),
                  updated_at = NOW()
            WHERE id = $7`,
          [d.company_name, d.contact_name, d.phone, d.email, d.address, doc.url, user.supplier_id],
        );
        await logActivity(client, {
          actor: user,
          action: 'update_supplier_profile',
          entityType: 'supplier',
          entityId: user.supplier_id,
          summary: `${d.contact_name} memperbarui profil akun dan data usaha ${d.company_name}.`,
        });
      } catch (err) {
        if (err.code === '23505') {
          throw new AppError('Email tersebut sudah digunakan oleh akun lain.', 'email');
        }
        throw err;
      }
    });

    revalidatePath('/account');
    revalidatePath('/dashboard');
    revalidatePath('/supply-orders');
    revalidatePath('/shipments');
    revalidatePath('/suppliers');
    return success('Profil akun dan data usaha berhasil diperbarui.');
  }, formData);
}

export async function changeSupplierPasswordAction(_prev, formData) {
  const user = await requireUser(['supplier']);
  const parsed = parse(supplierChangePasswordSchema, formToObject(formData));
  if (!parsed.ok) {
    return fail('Periksa kembali isian kata sandi Anda.', parsed.errors);
  }

  const { current_password, new_password } = parsed.data;
  if (current_password === new_password) {
    return fail('Kata sandi baru harus berbeda dari kata sandi saat ini.', {
      new_password: 'Gunakan kata sandi baru yang berbeda.',
    });
  }

  return run(async () => {
    await withTransaction(async (client) => {
      const res = await client.query('SELECT password_hash FROM users WHERE id = $1 FOR UPDATE', [user.id]);
      const row = res.rows[0];
      if (!row) throw new AppError('Akun tidak ditemukan.');

      const valid = await bcrypt.compare(current_password, row.password_hash);
      if (!valid) {
        throw new AppError('Kata sandi saat ini tidak sesuai.', 'current_password');
      }

      const nextHash = await bcrypt.hash(new_password, 10);
      await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [nextHash, user.id]);
      await logActivity(client, {
        actor: user,
        action: 'change_password',
        entityType: 'user',
        entityId: user.id,
        summary: `${user.name} memperbarui kata sandi akun supplier.`,
      });
    });

    revalidatePath('/account');
    return success('Kata sandi berhasil diperbarui. Gunakan kata sandi baru saat login berikutnya.');
  });
}
