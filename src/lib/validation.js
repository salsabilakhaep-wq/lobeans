import { z } from 'zod';
import { APP_CONFIG } from './appConfig.js';
import { PROCESS_METHODS, PRODUCT_UNITS } from './constants.js';
import { isValidDate, todayISO } from './format.js';

export function parse(schema, obj) {
  const result = schema.safeParse(obj);
  if (result.success) return { ok: true, data: result.data };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

const text = (label, { min = 1, max = 255 } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .min(min, `${label} minimal ${min} karakter`)
    .max(max, `${label} maksimal ${max} karakter`);

const decimal = (label, { min = 0 } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .superRefine((v, ctx) => {
      const n = Number(v);
      if (Number.isNaN(n)) ctx.addIssue({ code: 'custom', message: `${label} harus berupa angka` });
      else if (n < min) ctx.addIssue({ code: 'custom', message: `${label} minimal ${min}` });
      else if (n > APP_CONFIG.limits.maxDecimalValue) ctx.addIssue({ code: 'custom', message: `${label} terlalu besar` });
    })
    .transform((v) => Math.round(Number(v) * 100) / 100);

const idField = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib dipilih`)
    .superRefine((v, ctx) => {
      const n = Number(v);
      if (!/^\d+$/.test(v) || !Number.isSafeInteger(n) || n <= 0 || n > APP_CONFIG.limits.maxPgInt4) {
        ctx.addIssue({ code: 'custom', message: `${label} tidak valid` });
      }
    })
    .transform(Number);

const dateField = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .refine(isValidDate, `${label} tidak valid`)
    .superRefine((v, ctx) => {
      if (!APP_CONFIG.security.disallowPastDates) return;
      const today = todayISO();
      if (v < today) {
        ctx.addIssue({
          code: 'custom',
          message: `${label} tidak boleh sebelum tanggal hari ini (${today})`,
        });
      }
    });

const email = z
  .string()
  .trim()
  .min(1, 'Email wajib diisi')
  .max(150, 'Email maksimal 150 karakter')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid')
  .transform((v) => v.toLowerCase());

const password = z
  .string()
  .min(APP_CONFIG.auth.minPasswordLength, `Kata sandi minimal ${APP_CONFIG.auth.minPasswordLength} karakter`)
  .max(APP_CONFIG.auth.maxPasswordLength, `Kata sandi maksimal ${APP_CONFIG.auth.maxPasswordLength} karakter`);

// ---------------------------------------------------------------- Auth
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const supplierRegisterSchema = z
  .object({
    company_name: text('Nama perusahaan / koperasi', { min: 2, max: 150 }),
    contact_name: text('Nama penanggung jawab', { min: 2, max: 100 }),
    phone: text('Nomor telepon', { min: 6, max: 30 }),
    email,
    address: text('Alamat lengkap', { min: 5, max: 500 }),
    password,
    confirm_password: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ['confirm_password'],
    message: 'Konfirmasi kata sandi tidak cocok',
  });

// ---------------------------------------------------------------- Users (Admin)
const roleCode = z.enum(['admin', 'manager', 'staff', 'supplier'], 'Pilih role yang valid');
const createRoleCode = z.enum(['manager', 'staff', 'supplier'], 'Pilih role Staff, Manager, atau Supplier');

export const userCreateSchema = z
  .object({
    name: text('Nama lengkap', { min: 2, max: 100 }),
    email,
    role: createRoleCode,
    supplier_mode: z.enum(['new', 'existing']).optional().default('new'),
    supplier_id: z.string().trim().optional().default(''),
    company_name: z.string().trim().max(150, 'Nama perusahaan maksimal 150 karakter').optional().default(''),
    phone: z.string().trim().max(30, 'Nomor telepon maksimal 30 karakter').optional().default(''),
    address: z.string().trim().max(500, 'Alamat maksimal 500 karakter').optional().default(''),
    password,
  })
  .superRefine((d, ctx) => {
    if (d.role !== 'supplier') return;
    if (d.supplier_mode === 'existing') {
      if (!/^\d+$/.test(d.supplier_id) || Number(d.supplier_id) <= 0) {
        ctx.addIssue({ code: 'custom', path: ['supplier_id'], message: 'Pilih profil Supplier yang tersedia.' });
      }
      return;
    }
    if (d.company_name.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['company_name'], message: 'Nama perusahaan / koperasi wajib diisi minimal 2 karakter.' });
    }
    if (d.phone.length < 6) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Nomor telepon wajib diisi minimal 6 karakter.' });
    }
    if (d.address.length < 5) {
      ctx.addIssue({ code: 'custom', path: ['address'], message: 'Alamat lengkap wajib diisi minimal 5 karakter.' });
    }
  });

export const userUpdateSchema = z.object({
  name: text('Nama', { min: 2, max: 100 }),
  email,
  role: roleCode,
  is_active: z.enum(['true', 'false']).optional().default('true'),
  password: z
    .string()
    .optional()
    .default('')
    .refine(
      (v) => v === '' || (v.length >= APP_CONFIG.auth.minPasswordLength && v.length <= APP_CONFIG.auth.maxPasswordLength),
      `Kata sandi baru minimal ${APP_CONFIG.auth.minPasswordLength} karakter`,
    ),
});

// ---------------------------------------------------------------- Suppliers (Admin)
export const supplierSchema = z.object({
  supplier_code: z
    .string()
    .trim()
    .min(2, 'Kode supplier minimal 2 karakter')
    .max(30, 'Kode maksimal 30 karakter')
    .transform((v) => v.toUpperCase()),
  company_name: text('Nama perusahaan / koperasi', { min: 2, max: 150 }),
  contact_name: text('Nama penanggung jawab', { min: 2, max: 100 }),
  phone: text('Nomor telepon', { min: 6, max: 30 }),
  email,
  address: z.string().trim().max(500).optional().default(''),
});

// ---------------------------------------------------------------- Categories
export const categorySchema = z.object({
  name: text('Nama kategori', { max: 100 }),
  description: text('Deskripsi', { max: 500 }),
});

// ---------------------------------------------------------------- Products (Admin & Manager)
const productBase = {
  name: text('Nama produk', { max: 150 }),
  category_id: idField('Kategori'),
  variety: text('Varietas', { max: 100 }),
  process_method: z.string().refine((v) => PROCESS_METHODS.includes(v), 'Pilih metode proses'),
  origin_region: text('Asal wilayah', { max: 100 }),
  description: text('Deskripsi', { max: 1000 }),
  buy_price: decimal('Harga beli'),
  sell_price: decimal('Harga jual'),
  min_stock: decimal('Batas stok minimum'),
  low_stock: decimal('Ambang stok rendah'),
  stock: decimal('Jumlah stok', { min: 0 }),
  unit: z.string().refine((v) => PRODUCT_UNITS.includes(v), 'Pilih satuan produk'),
  rack_location: text('Lokasi rak / silo', { max: 50 }),
};

const lowGtMin = [
  (d) => d.low_stock > d.min_stock,
  { path: ['low_stock'], message: 'Ambang stok rendah (Low) harus lebih besar dari batas minimum (Severe)' },
];

export const productCreateSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(2, 'SKU wajib diisi')
      .regex(/^[A-Za-z0-9._-]{2,50}$/, 'SKU 2–50 karakter: huruf, angka, titik, minus, garis bawah')
      .transform((v) => v.toUpperCase()),
    ...productBase,
  })
  .refine(...lowGtMin);

export const productUpdateSchema = z.object(productBase).refine(...lowGtMin);

// ---------------------------------------------------------------- Supply Order (Manager -> Supplier)
export const supplyOrderSchema = z
  .object({
    supplier_id: idField('Supplier'),
    order_date: dateField('Tanggal permintaan'),
    expected_date: dateField('Perkiraan tanggal tiba'),
    notes: text('Catatan permintaan', { max: 500 }),
  })
  .refine((d) => d.expected_date >= d.order_date, {
    path: ['expected_date'],
    message: 'Perkiraan tanggal tiba tidak boleh sebelum tanggal permintaan',
  });

// ---------------------------------------------------------------- Transactions (IN & OUT)
export const incomingSchema = z.object({
  inspection_id: idField('Hasil pemeriksaan'),
  trx_date: dateField('Tanggal pencatatan barang masuk'),
  notes: text('Catatan barang masuk', { min: 3, max: 500 }),
});

export const outgoingSchema = z.object({
  trx_date: dateField('Tanggal pengiriman'),
  recipient_name: text('Nama penerima / customer', { min: 2, max: 150 }),
  destination: text('Tujuan pengiriman', { min: 3, max: 300 }),
  notes: text('Catatan', { max: 500 }),
});

export const reasonSchema = z.object({
  reason: text('Alasan penolakan', { min: 3, max: 500 }),
});

// ---------------------------------------------------------------- Account (Supplier Self-Service)
export const supplierAccountProfileSchema = z.object({
  company_name: text('Nama perusahaan / koperasi', { min: 2, max: 150 }),
  contact_name: text('Nama penanggung jawab', { min: 2, max: 100 }),
  email,
  phone: text('Nomor telepon', { min: 6, max: 30 }),
  address: text('Alamat lengkap', { min: 5, max: 500 }),
});

export const supplierChangePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
    new_password: password,
    confirm_password: z.string().min(1, 'Konfirmasi kata sandi baru wajib diisi'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    path: ['confirm_password'],
    message: 'Konfirmasi kata sandi baru tidak cocok',
  });
