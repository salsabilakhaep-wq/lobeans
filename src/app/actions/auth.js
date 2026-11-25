'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { APP_CONFIG } from '@/lib/appConfig.js';
import { one, withTransaction } from '@/lib/db.js';
import { createSession, destroySession } from '@/lib/session.js';
import { logActivity, notifyRole } from '@/lib/audit.js';
import { AppError } from '@/lib/errors.js';
import { fail, formToObject, run } from '@/lib/form.js';
import { removeImage, saveImage } from '@/lib/upload.js';
import { loginSchema, parse, supplierRegisterSchema } from '@/lib/validation.js';

const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.bwQWqVVJi1oYVd8GJ0fcOykYFLzW';

export async function loginAction(_prev, formData) {
  const parsed = parse(loginSchema, formToObject(formData));
  if (!parsed.ok) return fail('Periksa kembali isian Anda.', parsed.errors, formData);

  const { email, password } = parsed.data;
  const user = await one(
    `SELECT u.id, u.name, u.email, u.password_hash, u.is_active, u.supplier_id,
            r.code AS role,
            s.verification_status, s.reject_reason AS supplier_reject_reason
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN suppliers s ON s.id = u.supplier_id
      WHERE u.email = $1`,
    [email],
  );
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) return fail('Email atau kata sandi salah.', {}, formData);

  if (user.role === 'supplier') {
    if (user.verification_status === 'pending') {
      return fail(
        'Pendaftaran akun supplier Anda sedang ditinjau oleh Admin. Anda dapat masuk setelah akun disetujui.',
        {},
        formData,
      );
    }
    if (user.verification_status === 'rejected') {
      return fail(
        `Pendaftaran akun supplier Anda ditolak oleh Admin.${user.supplier_reject_reason ? ` Alasan: ${user.supplier_reject_reason}` : ''}`,
        {},
        formData,
      );
    }
  }

  if (!user.is_active) {
    return fail('Akun Anda sedang dinonaktifkan. Silakan hubungi tim LOBEANS.', {}, formData);
  }

  await createSession(user);
  redirect('/dashboard');
}

export async function registerSupplierAction(_prev, formData) {
  const parsed = parse(supplierRegisterSchema, formToObject(formData));
  if (!parsed.ok) {
    return fail('Periksa kembali data pendaftaran supplier Anda.', parsed.errors, formData);
  }
  const doc = await saveImage(formData.get('document'), { required: true });
  if (doc.error) {
    return fail(
      'Dokumen profil / legalitas usaha wajib diunggah.',
      { document: 'Dokumen profil / legalitas usaha wajib diunggah.' },
      formData,
    );
  }
  const d = parsed.data;

  return run(async () => {
    try {
      await withTransaction(async (client) => {
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [d.email]);
        if (existing.rowCount > 0) {
          throw new AppError('Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.', 'email');
        }

        const roleRow = await client.query("SELECT id FROM roles WHERE code = 'supplier'");
        if (roleRow.rowCount === 0) throw new AppError('Konfigurasi peran supplier tidak tersedia.');

        // Kunci transaksi atomik agar pembuatan kode supplier tidak bentrok saat pendaftaran bersamaan
        await client.query("SELECT pg_advisory_xact_lock(hashtext('lobeans_supplier_code'))");
        const cntRow = await client.query('SELECT COALESCE(MAX(id), 0)::int + 1 AS next_id FROM suppliers');
        let nextNum = cntRow.rows[0].next_id;
        let code = `${APP_CONFIG.supplier.codePrefix}${String(nextNum).padStart(APP_CONFIG.supplier.codePadLength, '0')}`;
        for (let attempt = 0; attempt < APP_CONFIG.supplier.codeMaxRetry; attempt++) {
          const dupCode = await client.query('SELECT 1 FROM suppliers WHERE supplier_code = $1', [code]);
          if (dupCode.rowCount === 0) break;
          nextNum += 1;
          code = `${APP_CONFIG.supplier.codePrefix}${String(nextNum).padStart(APP_CONFIG.supplier.codePadLength, '0')}`;
        }

        const hash = await bcrypt.hash(d.password, APP_CONFIG.auth.bcryptRounds);

        const supIns = await client.query(
          `INSERT INTO suppliers (supplier_code, company_name, contact_name, phone, email, address, document_url, verification_status, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', FALSE)
           RETURNING id`,
          [code, d.company_name, d.contact_name, d.phone, d.email, d.address, doc.url],
        );
        const supplierId = supIns.rows[0].id;

        const userIns = await client.query(
          `INSERT INTO users (role_id, supplier_id, name, email, password_hash, is_active)
           VALUES ($1, $2, $3, $4, $5, FALSE)
           RETURNING id`,
          [roleRow.rows[0].id, supplierId, d.contact_name, d.email, hash],
        );

        await logActivity(client, {
          actor: { id: userIns.rows[0].id, role: 'supplier' },
          action: 'register_supplier',
          entityType: 'supplier',
          entityId: supplierId,
          summary: `${d.company_name} (${d.contact_name}) mendaftar sebagai Supplier baru dan menunggu verifikasi Admin.`,
        });

        await notifyRole(client, 'admin', {
          title: 'Pendaftaran Supplier Baru',
          message: `${d.company_name} mendaftar sebagai mitra supplier dan menunggu verifikasi.`,
          link: '/suppliers',
        });
      });
    } catch (err) {
      await removeImage(doc.url);
      throw err;
    }

    redirect(
      '/login?ok=' +
        encodeURIComponent(
          'Pendaftaran akun supplier berhasil dikirim! Akun Anda berstatus Menunggu Verifikasi dan dapat digunakan setelah disetujui Admin.',
        ),
    );
  }, formData);
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}
