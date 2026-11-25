'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { withTransaction } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { logActivity } from '@/lib/audit.js';
import { AppError } from '@/lib/errors.js';
import { fail, formToObject, parsePositiveInt, run, success } from '@/lib/form.js';
import { removeImage, saveImage } from '@/lib/upload.js';
import { parse, categorySchema } from '@/lib/validation.js';

const done = (msg) => redirect('/categories?ok=' + encodeURIComponent(msg));

export async function createCategoryAction(_prev, formData) {
  const actor = await requireUser(['admin', 'manager']);
  const parsed = parse(categorySchema, formToObject(formData));
  if (!parsed.ok) {
    return fail('Periksa kembali isian kategori.', parsed.errors, formData);
  }
  const img = await saveImage(formData.get('image'), { required: true });
  if (img.error) {
    return fail('Gambar kategori wajib diunggah.', { image: 'Gambar kategori wajib diunggah.' }, formData);
  }
  const d = parsed.data;
  return run(async () => {
    try {
      await withTransaction(async (client) => {
        try {
          const ins = await client.query(
            'INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING id',
            [d.name, d.description, img.url],
          );
          await logActivity(client, {
            actor,
            action: 'create_category',
            entityType: 'category',
            entityId: ins.rows[0].id,
            summary: `${actor.name} menambahkan kategori ${d.name}.`,
          });
        } catch (err) {
          if (err.code === '23505') throw new AppError('Nama kategori sudah ada.', 'name');
          throw err;
        }
      });
    } catch (err) {
      await removeImage(img.url);
      throw err;
    }
    revalidatePath('/categories');
    done(`Kategori ${d.name} berhasil ditambahkan.`);
  }, formData);
}

export async function updateCategoryAction(id, _prev, formData) {
  const actor = await requireUser(['admin', 'manager']);
  const catId = parsePositiveInt(id);
  if (!catId) return fail('ID kategori tidak valid.', {}, formData);
  const parsed = parse(categorySchema, formToObject(formData));
  if (!parsed.ok) {
    return fail('Periksa kembali isian kategori.', parsed.errors, formData);
  }
  const img = await saveImage(formData.get('image'), { required: false });
  if (img.error) {
    return fail(img.error, { image: img.error }, formData);
  }
  const d = parsed.data;
  return run(async () => {
    try {
      await withTransaction(async (client) => {
        try {
          const res = await client.query(
            'UPDATE categories SET name=$1, description=$2, image_url=COALESCE($3, image_url), updated_at=NOW() WHERE id=$4',
            [d.name, d.description, img.url, catId],
          );
          if (res.rowCount === 0) throw new AppError('Kategori tidak ditemukan.');
          await logActivity(client, {
            actor,
            action: 'update_category',
            entityType: 'category',
            entityId: catId,
            summary: `${actor.name} memperbarui kategori ${d.name}.`,
          });
        } catch (err) {
          if (err.code === '23505') throw new AppError('Nama kategori sudah ada.', 'name');
          throw err;
        }
      });
    } catch (err) {
      await removeImage(img.url);
      throw err;
    }
    revalidatePath('/categories');
    done('Kategori berhasil diperbarui.');
  }, formData);
}

export async function toggleCategoryActiveAction(_prev, formData) {
  const actor = await requireUser(['admin', 'manager']);
  const id = parsePositiveInt(formData.get('id'));
  if (!id) return fail('ID kategori tidak valid.');
  const nextActive = formData.get('next_active') === 'true';
  return run(async () => {
    await withTransaction(async (client) => {
      if (!nextActive) {
        const infoRes = await client.query(
          `SELECT c.name,
                  COUNT(p.id) FILTER (WHERE p.is_active = TRUE)::int AS active_products,
                  COALESCE(SUM(p.stock) FILTER (WHERE p.is_active = TRUE), 0)::numeric AS total_stock
             FROM categories c
             LEFT JOIN products p ON p.category_id = c.id
            WHERE c.id = $1
            GROUP BY c.id`,
          [id],
        );
        const info = infoRes.rows[0];
        if (!info) throw new AppError('Kategori tidak ditemukan.');
        if (Number(info.total_stock) > 0) {
          throw new AppError(
            `Kategori "${info.name}" tidak dapat dihapus karena masih memiliki stok tersisa sebesar ${info.total_stock} kg (${info.active_products} produk aktif).`,
          );
        }
        if (info.active_products > 0) {
          throw new AppError(
            `Kategori "${info.name}" tidak dapat dihapus karena masih memiliki ${info.active_products} produk aktif di dalamnya.`,
          );
        }
      }
      const res = await client.query('UPDATE categories SET is_active=$1, updated_at=NOW() WHERE id=$2 RETURNING name', [
        nextActive,
        id,
      ]);
      if (res.rowCount === 0) throw new AppError('Kategori tidak ditemukan.');
      await logActivity(client, {
        actor,
        action: nextActive ? 'activate_category' : 'deactivate_category',
        entityType: 'category',
        entityId: id,
        summary: `${actor.name} ${nextActive ? 'mengaktifkan' : 'menonaktifkan'} kategori ${res.rows[0].name}.`,
      });
    });
    revalidatePath('/categories');
    return success(nextActive ? 'Kategori diaktifkan.' : 'Kategori dinonaktifkan.');
  }, formData);
}
