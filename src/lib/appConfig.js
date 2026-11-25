/**
 * ============================================================================
 * KONFIGURASI TERPUSAT APLIKASI LOBEANS (NON-LANDING / SISTEM INTERNAL)
 * ============================================================================
 * File ini kompatibel dengan Edge Runtime (middleware) maupun Node.js Runtime.
 * Ubah parameter di sini untuk menyesuaikan aturan autentikasi, upload file,
 * paginasi, batas angka, maupun keamanan aplikasi dengan cepat saat demo.
 * ============================================================================
 */

export const APP_CONFIG = {
  /* ── 1. PENGATURAN AUTENTIKASI & SESI (JWT COOKIE) ── */
  auth: {
    cookieName: 'lobeans_session', // Nama cookie sesi JWT.
    sessionHours: 8,               // Lama sesi login sebelum kedaluwarsa (jam).
    minPasswordLength: 8,          // Panjang minimal kata sandi pengguna.
    maxPasswordLength: 72,         // Panjang maksimal kata sandi (batas aman bcrypt).
    bcryptRounds: 10,              // Tingkat hashing bcrypt (10 = standar seimbang).
    minSecretLength: 32,           // Panjang minimal AUTH_SECRET di mode production.
    devFallbackSecret: 'dev-only-secret-change-me-please-32chars!',
  },

  /* ── 2. PENGATURAN UPLOAD GAMBAR & DOKUMEN ── */
  upload: {
    maxSizeMb: 2,                                      // Batas ukuran file upload (MB).
    allowedExtensions: ['jpg', 'png', 'webp', 'gif'],  // Ekstensi gambar yang diizinkan.
    cacheMaxAgeSeconds: 3600,                          // Durasi cache private untuk gambar terautentikasi (detik).
  },

  /* ── 3. PENGATURAN PAGINASI & BATAS TAMPILAN ── */
  pagination: {
    productsPerPage: 8,         // Jumlah kartu produk per halaman di /products.
    reportMovementsLimit: 40,   // Jumlah riwayat mutasi stok terbaru di /reports.
    reportShipmentsLimit: 30,   // Jumlah riwayat pengiriman terbaru di /reports.
    reportLogsLimit: 40,        // Jumlah log aktivitas terbaru di /reports.
  },

  /* ── 4. PENGATURAN BATAS VALIDASI & KODE OTOMATIS ── */
  limits: {
    maxPgInt4: 2_147_483_647,   // Batas maksimum tipe INT PostgreSQL (cegah error overflow 22003).
    maxItemsPerOrder: 100,      // Maksimal baris produk dalam 1 PO / Transaksi.
    maxOrderQty: 1_000_000,     // Maksimal kuantitas (kg) per baris item.
    maxDecimalValue: 1_000_000_000_000, // Batas atas angka harga/stok.
  },

  supplier: {
    codePrefix: 'SUP-',         // Awalan kode otomatis supplier baru (mis. SUP-004).
    codePadLength: 3,           // Jumlah digit angka pada kode supplier (001, 002, dst).
    codeMaxRetry: 5,            // Jumlah percobaan ulang otomatis jika kode bentrok saat pendaftaran bersamaan.
  },

  supplyOrder: {
    defaultRestockQty: 25,      // Jumlah default (kg) saat klik tombol "+ Permintaan PO" dari produk stok menipis.
    defaultExpectedDays: 7,     // Target default kedatangan barang (hari dari tanggal permintaan).
  },

  /* ── 5. PENGATURAN KEAMANAN TAMBAHAN (HARDENING) ── */
  security: {
    requireAuthForUploads: true,       // Wajib login untuk membuka file di /uploads/[file].
    protectCsvFormulaInjection: true,  // Cegah eksekusi rumus Excel (=, +, -, @) saat export CSV.
    disallowPastDates: true,           // Tolak tanggal PO / transaksi IN / OUT yang berada sebelum hari ini.
    allowedDeleteSupplyRedirects: ['/supply-orders', '/dashboard'], // Daftar path redirect aman saat hapus PO.
  },
};
