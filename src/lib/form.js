import { AppError } from './errors.js';
import { APP_CONFIG } from './appConfig.js';

/**
 * Validasi ID numerik agar selalu bilangan bulat positif dalam batas INT4 PostgreSQL.
 * Mencegah error tipe data PostgreSQL (22P02 / 22003) akibat ID invalid atau terlalu besar.
 */
export function parsePositiveInt(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 && value <= APP_CONFIG.limits.maxPgInt4 ? value : null;
  }
  const s = String(value ?? '').trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n > 0 && n <= APP_CONFIG.limits.maxPgInt4 ? n : null;
}

/**
 * Validasi path redirect internal untuk mencegah celah Open Redirect.
 * Hanya mengizinkan path relatif diawali satu "/" dan (opsional) terdaftar dalam allowlist.
 */
export function safeInternalPath(rawPath, allowedPaths = null) {
  const s = String(rawPath ?? '').trim();
  if (!s || !s.startsWith('/') || s.startsWith('//') || s.includes('\\') || /[\r\n]/.test(s)) {
    return '';
  }
  if (Array.isArray(allowedPaths) && allowedPaths.length > 0 && !allowedPaths.includes(s)) {
    return '';
  }
  return s;
}

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
  if (arr.length > APP_CONFIG.limits.maxItemsPerOrder) {
    return { error: `Maksimal ${APP_CONFIG.limits.maxItemsPerOrder} produk.` };
  }

  const seen = new Set();
  const items = [];
  for (const row of arr) {
    const product_id = parsePositiveInt(row?.product_id);
    const quantity = Math.round(Number(row?.quantity) * 100) / 100;
    if (!product_id) return { error: 'Produk belum dipilih pada salah satu baris.' };
    if (Number.isNaN(quantity) || quantity <= 0) return { error: 'Kuantitas (kg) harus lebih dari 0.' };
    if (quantity > APP_CONFIG.limits.maxOrderQty) return { error: 'Kuantitas terlalu besar.' };
    if (seen.has(product_id)) return { error: 'Produk yang sama tidak boleh dipilih dua kali.' };
    seen.add(product_id);
    items.push({ product_id, quantity });
  }
  return { items };
}
