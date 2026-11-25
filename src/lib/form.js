import { AppError } from './errors.js';

export function formToObject(formData) {
  const obj = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('$')) continue;
    obj[key] = typeof value === 'string' ? value : '';
  }
  return obj;
}

export function fail(message, errors = {}, formData) {
  const values = {};
  if (formData) {
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('$') || /password/i.test(key)) continue;
      if (typeof value === 'string') values[key] = value;
    }
  }
  return { ok: false, message, errors, values };
}

export function success(message) {
  return { ok: true, message };
}

const DB_DOWN = ['28P01', '3D000', 'ECONNREFUSED', 'EACCES', 'ENOTFOUND', 'ETIMEDOUT'];

export async function run(fn, formData) {
  try {
    return await fn();
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) throw err;
    if (err instanceof AppError) {
      return fail(err.message, err.field ? { [err.field]: err.message } : {}, formData);
    }
    if (DB_DOWN.includes(err?.code) || Array.isArray(err?.errors)) {
      return fail('Database belum terhubung. Periksa koneksi PostgreSQL pada .env.local.', {}, formData);
    }
    console.error(err);
    return fail('Terjadi kesalahan pada server. Silakan coba lagi.', {}, formData);
  }
}

export function parseItems(raw) {
  let arr;
  try {
    arr = JSON.parse(raw || '[]');
  } catch {
    return { error: 'Data produk tidak valid.' };
  }
  if (!Array.isArray(arr) || arr.length === 0) return { error: 'Pilih minimal satu produk.' };
  if (arr.length > 100) return { error: 'Maksimal 100 produk.' };

  const seen = new Set();
  const items = [];
  for (const row of arr) {
    const product_id = Number(row?.product_id);
    const quantity = Math.round(Number(row?.quantity) * 100) / 100;
    if (!Number.isInteger(product_id) || product_id <= 0) return { error: 'Produk belum dipilih pada salah satu baris.' };
    if (Number.isNaN(quantity) || quantity <= 0) return { error: 'Kuantitas (kg) harus lebih dari 0.' };
    if (quantity > 1_000_000) return { error: 'Kuantitas terlalu besar.' };
    if (seen.has(product_id)) return { error: 'Produk yang sama tidak boleh dipilih dua kali.' };
    seen.add(product_id);
    items.push({ product_id, quantity });
  }
  return { items };
}
