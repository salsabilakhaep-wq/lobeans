'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { withTransaction } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { logActivity } from '@/lib/audit.js';
import { AppError } from '@/lib/errors.js';
import { fail, formToObject, run, success } from '@/lib/form.js';
import { saveImage } from '@/lib/upload.js';
import { parse, productCreateSchema, productUpdateSchema } from '@/lib/validation.js';

const done = (msg) => redirect('/products?ok=' + encodeURIComponent(msg));

export async function createProductAction(_prev, formData) {
  const actor = await requireUser(['admin', 'manager']);
  const parsed = parse(productCreateSchema, formToObject(formData));
  const img = await saveImage(formData.get('image'), { required: true });
  if (!parsed.ok || img.error) {
    const imgErr = img.error ? 'Gambar produk wajib diunggah.' : undefined;
    return fail(
      imgErr || 'Periksa kembali isian produk.',
      { ...parsed.errors, ...(imgErr ? { image: imgErr } : {}) },
      formData,
    );
  }
  const d = parsed.data;
  return run(async () => {
    await withTransaction(async (client) => {
      try {
        const ins = await client.query(
          `INSERT INTO products (sku, name, category_id, variety, process_method, origin_region, description,
                                 buy_price, sell_price, min_stock, low_stock, stock, unit, rack_location, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
          [d.sku, d.name, d.category_id, d.variety, d.process_method, d.origin_region, d.description,
           d.buy_price, d.sell_price, d.min_stock, d.low_stock, d.stock, d.unit, d.rack_location, img.url],
        );
        await logActivity(client, {
          actor,
          action: 'create_product',
          entityType: 'product',
          entityId: ins.rows[0].id,
          summary: `${actor.name} menambahkan produk ${d.name} (${d.sku}) dengan stok ${d.stock} ${d.unit}.`,
        });
      } catch (err) {
        if (err.code === '23505') throw new AppError('SKU sudah dipakai produk lain.', 'sku');
        if (err.code === '23503') throw new AppError('Kategori tidak ditemukan.', 'category_id');
        throw err;
      }
    });
    revalidatePath('/products');
    revalidatePath('/dashboard');
    done(`Produk ${d.name} berhasil ditambahkan.`);
  }, formData);
}

export async function updateProductAction(id, _prev, formData) {
  const actor = await requireUser(['admin', 'manager']);
  const parsed = parse(productUpdateSchema, formToObject(formData));
  const img = await saveImage(formData.get('image'), { required: false });
  if (!parsed.ok || img.error) {
    return fail(img.error || 'Periksa kembali isian produk.', { ...parsed.errors, ...(img.error ? { image: img.error } : {}) }, formData);
  }
  const d = parsed.data;
  return run(async () => {
    await withTransaction(async (client) => {
      const res = await client.query(
        `UPDATE products
            SET name=$1, category_id=$2, variety=$3, process_method=$4, origin_region=$5, description=$6,
                buy_price=$7, sell_price=$8, min_stock=$9, low_stock=$10, stock=$11, unit=$12, rack_location=$13,
                image_url=COALESCE($14, image_url), updated_at=NOW()
          WHERE id=$15`,
        [d.name, d.category_id, d.variety, d.process_method, d.origin_region, d.description,
         d.buy_price, d.sell_price, d.min_stock, d.low_stock, d.stock, d.unit, d.rack_location, img.url, id],
      );
      if (res.rowCount === 0) throw new AppError('Produk tidak ditemukan.');
      await logActivity(client, {
        actor,
        action: 'update_product',
        entityType: 'product',
        entityId: Number(id),
        summary: `${actor.name} memperbarui data produk ${d.name}.`,
      });
    });
    revalidatePath('/products');
    revalidatePath(`/products/${id}`);
    revalidatePath('/dashboard');
    done('Produk berhasil diperbarui.');
  }, formData);
}

/**
 * Hapus / nonaktifkan produk.
 * Peringatan ketat: Produk yang masih memiliki stok (> 0) TIDAK BOLEH dihapus!
 */
export async function toggleProductActiveAction(_prev, formData) {
  const actor = await requireUser(['admin', 'manager']);
  const id = Number(formData.get('id'));
  const nextActive = formData.get('next_active') === 'true';
  return run(async () => {
    await withTransaction(async (client) => {
      const cur = await client.query('SELECT name, stock, unit FROM products WHERE id = $1 FOR UPDATE', [id]);
      const row = cur.rows[0];
      if (!row) throw new AppError('Produk tidak ditemukan.');

      if (!nextActive && Number(row.stock) > 0) {
        throw new AppError(
          `Produk "${row.name}" tidak boleh dihapus karena masih memiliki stok tersisa (${row.stock} ${row.unit}).`,
        );
      }

      await client.query('UPDATE products SET is_active = $1, updated_at = NOW() WHERE id = $2', [nextActive, id]);
      await logActivity(client, {
        actor,
        action: nextActive ? 'activate_product' : 'deactivate_product',
        entityType: 'product',
        entityId: id,
        summary: `${actor.name} ${nextActive ? 'mengaktifkan' : 'menghapus/menonaktifkan'} produk ${row.name}.`,
      });
    });
    revalidatePath('/products');
    revalidatePath('/dashboard');
    return success(nextActive ? 'Produk berhasil diaktifkan kembali.' : 'Produk berhasil dihapus (dinonaktifkan).');
  }, formData);
}
