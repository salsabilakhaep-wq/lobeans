# Panduan Setup Basis Data PostgreSQL — LOBEANS

Dokumen ini memandu langkah-langkah membuat, mengimpor skema, dan mengisi data awal basis data untuk aplikasi **LOBEANS — Coffee Inventory & Warehouse Management System**.

Seluruh file SQL disimpan secara terpisah di folder `src/database/` (sejajar dengan `src/app/`) agar penguji maupun pengembang dapat memeriksa struktur tabel serta menjalankan database secara mandiri melalui **pgAdmin 4** maupun **`psql`**.

## Isi Folder `src/database/`

| File | Keterangan |
|---|---|
| `schema.sql` | Struktur lengkap **17 tabel**, indeks, constraint, sequence, serta view otomatis `v_products` (`Normal`, `Low`, `Severe`, `Out of Stock`). |
| `seed.sql` | Data awal (*dummy data*) siap pakai: 4 role, 6 akun (password ter-hash `bcryptjs`), 3 supplier, 4 kategori kopi, 8 produk *green bean*, contoh PO/pengiriman/inspeksi, transaksi `IN`/`OUT`, riwayat stok, notifikasi, dan audit log. |
| `demo_dummy.sql` | *(Opsional / Tambahan)* Data dummy demo presentasi yang bersifat *additive & idempotent* (tidak menghapus data lama): 2 supplier tambahan, 4 varietas produk baru, 7 PO lengkap di setiap tahap workflow, serta 3 transaksi `OUT` (`Pending`, `Approved`, `Shipped`). |

---

## Langkah Setup Database di pgAdmin 4

1. **Buat Database Baru:**
   - Buka **pgAdmin 4**.
   - Klik kanan pada **Databases** → **Create** → **Database…**.
   - Masukkan nama database: `lobeans_db`.
   - Klik **Save**.

2. **Buka Query Tool pada Database `lobeans_db`:**
   - Klik kanan pada database `lobeans_db` → pilih **Query Tool**.

3. **Jalankan File Skema (`src/database/schema.sql`):**
   - Klik ikon folder (**Open File**) pada toolbar Query Tool, lalu pilih `src/database/schema.sql`.
   - Klik tombol **Execute / Refresh (F5)** dan tunggu hingga muncul pesan sukses (`Query returned successfully`).
   - *Hasil:* Seluruh 17 tabel (`roles`, `suppliers`, `users`, `categories`, `products`, `supply_orders`, `supply_order_items`, `shipments`, `inspections`, `inspection_items`, `inspection_photos`, `returns`, `inventory_transactions`, `inventory_transaction_items`, `stock_movements`, `notifications`, `activity_logs`), sequence, dan view `v_products` berhasil dibuat.

4. **Jalankan File Data Awal (`src/database/seed.sql`):**
   - Masih di Query Tool database `lobeans_db`, klik ikon **Open File**, lalu pilih `src/database/seed.sql`.
   - Klik tombol **Execute / Refresh (F5)** dan tunggu hingga muncul pesan sukses.
   - *Hasil:* Seluruh data dummy awal beserta akun demo siap digunakan.

---

## Alternatif Setup via Terminal (`psql`)

Jika Anda menggunakan terminal / Command Prompt dengan PostgreSQL CLI (`psql`):

```bash
psql -U postgres -c "CREATE DATABASE lobeans_db;"
psql -U postgres -d lobeans_db -f src/database/schema.sql
psql -U postgres -d lobeans_db -f src/database/seed.sql
# Opsional: tambah skenario dummy lengkap untuk demo presentasi
psql -U postgres -d lobeans_db -f src/database/demo_dummy.sql
```

---

## Konfigurasi Koneksi di Aplikasi (`.env.local`)

Salin file `.env.example` di root proyek menjadi `.env.local`, lalu sesuaikan username & password PostgreSQL di komputer Anda:

```env
DATABASE_URL=postgres://postgres:PASSWORD_POSTGRES_ANDA@localhost:5432/lobeans_db
AUTH_SECRET=lobeans-dev-secret-key-32chars-minimum-ok
COOKIE_SECURE=false
APP_TZ=Asia/Makassar
```

---

## Daftar Akun Demo & Password

Setelah `src/database/seed.sql` dijalankan, Anda dapat login di `http://localhost:3000/login` menggunakan akun berikut:

| Peran (Role) | Nama | Email | Password | Status |
|---|---|---|---|---|
| **Admin** | Salsabila Khaerani Putricia | `admin@lobeans.test` | `Admin123!` | Aktif |
| **Manager Gudang** | Zahrana Kumayla Irfan | `manager@lobeans.test` | `Manager123!` | Aktif |
| **Staff Gudang** | Ahmad Fauzi Ali | `staff@lobeans.test` | `Staff123!` | Aktif |
| **Supplier 1** | Prabowo Susanto (Koperasi Gayo) | `supplier1@lobeans.test` | `Supplier123!` | Aktif (Terverifikasi) |
| **Supplier 2** | Uzumaki Naruto (Kelompok Tani Toraja) | `supplier2@lobeans.test` | `Supplier123!` | Aktif (Terverifikasi) |
| **Supplier 3** | Peter Parker (Koperasi Kintamani) | `supplier3@lobeans.test` | `Supplier123!` | Pending (Menunggu Verifikasi Admin) |
| **Supplier 4** *(demo_dummy.sql)* | Raka Mahendra (Koperasi Flores Manggarai) | `supplier4@lobeans.test` | `Supplier123!` | Aktif (Terverifikasi) |
| **Supplier 5** *(demo_dummy.sql)* | Nadia Lestari (Koperasi Ijen Raung) | `supplier5@lobeans.test` | `Supplier123!` | Pending (Menunggu Verifikasi Admin) |

> **Catatan Keamanan:** Seluruh password di atas tersimpan di kolom `users.password_hash` dalam bentuk hash **`bcryptjs` (cost 10)**, bukan *plaintext*. Akun Supplier baru juga dapat didaftarkan langsung melalui halaman `/register` lalu diverifikasi oleh Admin.
