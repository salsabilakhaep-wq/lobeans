-- =====================================================================
--  LOBEANS — Smart Inventory, Better Coffee.
--  FILE 2/2 : DATA AWAL (SEED)
--
--  Data Awal:
--   - 4 Roles (admin, manager, staff, supplier)
--   - 3 Supplier (2 aktif terverifikasi + 1 menunggu verifikasi Admin)
--   - 6 Akun (Admin, Manager, Staff dari .sql + 3 Supplier)
--   - 4 Kategori (Arabika, Robusta, Liberika, Excelsa)
--   - 8 Produk (2 per kategori)
--   - Siklus PO: Pending -> Confirmed / Rejected -> In Transit -> Arrived -> Inspecting -> Received / Returned
--   - Siklus OUT: Pending -> Approved / Rejected -> Shipped (stok berkurang saat Shipped!)
-- =====================================================================

BEGIN;

TRUNCATE TABLE
  activity_logs,
  notifications,
  stock_movements,
  inventory_transaction_items,
  inventory_transactions,
  returns,
  inspection_photos,
  inspection_items,
  inspections,
  shipments,
  supply_order_items,
  supply_orders,
  products,
  categories,
  users,
  suppliers,
  roles
RESTART IDENTITY CASCADE;

ALTER SEQUENCE seq_supply_order RESTART WITH 1;
ALTER SEQUENCE seq_shipment     RESTART WITH 1;
ALTER SEQUENCE seq_trx_in       RESTART WITH 1;
ALTER SEQUENCE seq_trx_out      RESTART WITH 1;

-- 1. ROLES
INSERT INTO roles (code, name, description) VALUES
 ('admin',    'Admin',          'Verifikasi supplier, CRUD penuh produk & kategori, serta monitoring aktivitas gudang.'),
 ('manager',  'Manager Gudang', 'CRUD produk & kategori, membuat Restock Order (PO), validasi pemeriksaan, refund, dan approval transaksi IN/OUT.'),
 ('staff',    'Staff Gudang',   'Pemeriksaan fisik barang masuk, input transaksi IN & OUT, packing, dan penyelesaian pengiriman (Shipped).'),
 ('supplier', 'Supplier',       'Melihat & mengonfirmasi PO dari Manager, mengirim barang (In Transit), dan menyerahkan bukti foto kedatangan.');

-- 2. SUPPLIERS (2 aktif terverifikasi + 1 pendaftar baru menunggu verifikasi Admin)
INSERT INTO suppliers (supplier_code, company_name, contact_name, phone, email, address, document_url, verification_status, is_active) VALUES
 ('SUP-001', 'Koperasi Baitul Qiradh Baburrayyan Gayo', 'Prabowo Susanto', '0643-21098',     'supplier1@lobeans.test', 'Takengon, Aceh Tengah',    '/proof-sample.svg', 'approved', TRUE),
 ('SUP-002', 'Kelompok Tani Buntu Karua Toraja',        'Uzumaki Naruto',  '0812-4567-8901', 'supplier2@lobeans.test', 'Makale, Tana Toraja',      '/proof-sample.svg', 'approved', TRUE),
 ('SUP-003', 'Koperasi Kopi Kintamani Bali',            'Peter Parker',    '0813-9012-3456', 'supplier3@lobeans.test', 'Kintamani, Bangli, Bali',  '/proof-sample.svg', 'pending',  FALSE);

-- 3. USERS (Admin, Manager, Staff dibuat via .sql; Supplier via registrasi mandiri — bcrypt cost 10)
INSERT INTO users (role_id, supplier_id, name, email, password_hash, is_active) VALUES
 (1, NULL, 'Salsabila Khaerani Putricia', 'admin@lobeans.test',     '$2b$10$tkwcybARv7N1H2kUsTil5e4glZRM7dPruHvKAAgvfCo90gBJKOYIa', TRUE),
 (2, NULL, 'Zahrana Kumayla Irfan',       'manager@lobeans.test',   '$2b$10$yNsQPRjz645RCEBpWIzc0eaVEFigiG0SsD/MZoZ4sghcaI4h6MIum', TRUE),
 (3, NULL, 'Ahmad Fauzi Ali',             'staff@lobeans.test',     '$2b$10$aSI/Yk.LxYo92Mdg7xDEeOMJB/Zou9RZZdYC98Izhq6/8jnEHPWsu', TRUE),
 (4, 1,    'Prabowo Susanto',             'supplier1@lobeans.test', '$2b$10$f7B.nlDRoTQl/5hVCf7h5eCCGyfv8WDjvZc9vMQMoQsk4vZVT7Hta', TRUE),
 (4, 2,    'Uzumaki Naruto',              'supplier2@lobeans.test', '$2b$10$f7B.nlDRoTQl/5hVCf7h5eCCGyfv8WDjvZc9vMQMoQsk4vZVT7Hta', TRUE),
 (4, 3,    'Peter Parker',                'supplier3@lobeans.test', '$2b$10$f7B.nlDRoTQl/5hVCf7h5eCCGyfv8WDjvZc9vMQMoQsk4vZVT7Hta', FALSE);

-- 4. CATEGORIES (4 Kategori Kopi dengan gambar default)
INSERT INTO categories (name, description, image_url) VALUES
 ('Arabika',  'Kategori green bean Arabika specialty dataran tinggi dengan profil floral dan acidity bersih.', '/cat-arabika.svg'),
 ('Robusta',  'Kategori green bean Robusta petik merah pilihan berkarakter dark chocolate dan body tebal.',   '/cat-robusta.svg'),
 ('Liberika', 'Kategori green bean Liberika lahan gambut beraroma buah nangka eksotis dan manis alami.',     '/cat-liberika.svg'),
 ('Excelsa',  'Kategori green bean Excelsa dataran tinggi berkarakter woody, fruity, dan kompleks.',          '/cat-excelsa.svg');

-- 5. PRODUCTS (8 Produk Awal — 2 per Kategori, lengkap dengan gambar default)
INSERT INTO products (sku, name, category_id, variety, process_method, origin_region, description, buy_price, sell_price, min_stock, low_stock, stock, unit, rack_location, image_url) VALUES
 ('ARB-GYO-01', 'Arabika Gayo Grade 1',       1, 'Ateng Super', 'Semi-Washed', 'Aceh Tengah',      'Green bean Arabika Gayo Grade 1, kadar air 12%, notes herbal floral.', 98000,  140000, 20, 50, 120, 'kg', 'Silo-A1',   '/cat-arabika.svg'),
 ('ARB-TRJ-01', 'Arabika Toraja Kalosi',      1, 'S795',        'Wet-Hulled',  'Tana Toraja',      'Green bean Toraja Kalosi dengan aroma rempah dan clean finish.',        105000, 155000, 15, 40,  45, 'kg', 'Silo-A2',   '/cat-arabika.svg'),
 ('ROB-DMP-01', 'Robusta Dampit Fine',        2, 'BP 42',       'Natural',     'Malang Selatan',   'Robusta petik merah rasa dark chocolate dan karamel pekat.',             56000,  80000,  30, 80, 240, 'kg', 'Pallet-B1', '/cat-robusta.svg'),
 ('ROB-TMG-01', 'Robusta Temanggung Washed',  2, 'Tugusari',    'Full Washed', 'Temanggung',       'Robusta fine washed dengan aroma bersih dan manis alami.',               62000,  88000,  20, 50,  32, 'kg', 'Pallet-B2', '/cat-robusta.svg'),
 ('LIB-MNG-01', 'Liberika Mendahara Natural', 3, 'Liberika',    'Natural',     'Tanjung Jabung',   'Green bean Liberika beraroma buah nangka manis khas gambut.',            88000,  130000, 10, 25,  18, 'kg', 'Silo-C1',   '/cat-liberika.svg'),
 ('LIB-TJB-01', 'Liberika Tanjung Jabung',    3, 'Liberika',    'Honey',       'Jambi',            'Liberika proses honey dengan body penuh dan rasa manis buah tropis.',    92000,  136000, 10, 25,   8, 'kg', 'Silo-C2',   '/cat-liberika.svg'),
 ('EXC-WNS-01', 'Excelsa Wonosalam Honey',    4, 'Excelsa',     'Honey',       'Jombang Jatim',    'Excelsa dataran tinggi Wonosalam bercitarasa fruity tarty unik.',        82000,  120000, 10, 25,  14, 'kg', 'Silo-D1',   '/cat-excelsa.svg'),
 ('EXC-JMB-01', 'Excelsa Jember Natural',     4, 'Excelsa',     'Natural',     'Jember Jatim',     'Excelsa natural dengan sentuhan woody dan aroma rempah lembut.',         79000,  116000, 10, 25,   0, 'kg', 'Silo-D2',   '/cat-excelsa.svg');

-- 6. SUPPLY ORDERS (Restock Order / PO dibuat oleh Manager -> dikonfirmasi Supplier)
-- PO-1: Received   -> sudah selesai penuh (IN Approved -> PO otomatis Received, stok +100 kg)
-- PO-2: Inspecting -> pemeriksaan Sesuai selesai + Staff sudah mengajukan TRX-IN-2 (Pending menunggu konfirmasi Manager)
-- PO-3: Arrived    -> barang tiba beserta bukti foto kedatangan, menunggu Manager instruksikan Staff (Inspecting)
-- PO-4: Pending    -> PO baru dari Manager untuk Supplier 1, menunggu konfirmasi Supplier
INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status, decision_by, decision_at) VALUES
 ('PO-' || to_char(CURRENT_DATE - 10, 'YYYYMMDD') || '-' || lpad(nextval('seq_supply_order')::text, 4, '0'), 1, 2, CURRENT_DATE - 10, CURRENT_DATE - 6, 'Permintaan restock rutin Arabika Gayo Grade 1 kemasan karung 50 kg.', 'received',   4, NOW() - INTERVAL '9 days'),
 ('PO-' || to_char(CURRENT_DATE - 4,  'YYYYMMDD') || '-' || lpad(nextval('seq_supply_order')::text, 4, '0'), 2, 2, CURRENT_DATE - 4,  CURRENT_DATE,     'Permintaan pasokan Arabika Toraja Kalosi & Liberika Mendahara.',       'inspecting', 5, NOW() - INTERVAL '3 days'),
 ('PO-' || to_char(CURRENT_DATE - 2,  'YYYYMMDD') || '-' || lpad(nextval('seq_supply_order')::text, 4, '0'), 1, 2, CURRENT_DATE - 2,  CURRENT_DATE + 1, 'Permintaan pasokan Robusta Dampit Fine 80 kg untuk stok bulanan.',     'arrived',    4, NOW() - INTERVAL '2 days'),
 ('PO-' || to_char(CURRENT_DATE,      'YYYYMMDD') || '-' || lpad(nextval('seq_supply_order')::text, 4, '0'), 1, 2, CURRENT_DATE,      CURRENT_DATE + 5, 'Permintaan pasokan mendesak Excelsa Jember Natural (stok habis).',     'pending',    NULL, NULL);

INSERT INTO supply_order_items (supply_order_id, product_id, quantity) VALUES
 (1, 1, 100),
 (2, 2, 40), (2, 5, 20),
 (3, 3, 80),
 (4, 8, 50);

-- 7. SHIPMENTS
INSERT INTO shipments (shipment_number, supply_order_id, attempt_number, shipment_type, status, shipping_proof_url, arrival_proof_url, notes, shipped_at, arrived_at, created_by) VALUES
 ('SHP-' || to_char(CURRENT_DATE - 9, 'YYYYMMDD') || '-' || lpad(nextval('seq_shipment')::text, 4, '0'), 1, 1, 'initial', 'received',   '/proof-sample.svg', '/proof-sample.svg', 'Pengiriman utuh 100 kg Arabika Gayo.',           NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', 4),
 ('SHP-' || to_char(CURRENT_DATE - 2, 'YYYYMMDD') || '-' || lpad(nextval('seq_shipment')::text, 4, '0'), 2, 1, 'initial', 'inspecting', '/proof-sample.svg', '/proof-sample.svg', 'Pengiriman utuh Toraja 40 kg & Liberika 20 kg.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',  5),
 ('SHP-' || to_char(CURRENT_DATE - 1, 'YYYYMMDD') || '-' || lpad(nextval('seq_shipment')::text, 4, '0'), 3, 1, 'initial', 'arrived',    '/proof-sample.svg', '/proof-sample.svg', 'Truk tiba di pintu bongkar gudang pusat.',       NOW() - INTERVAL '1 day',  NOW() - INTERVAL '3 hours', 4);

-- 8. INSPECTIONS, ITEMS & PHOTOS
INSERT INTO inspections (shipment_id, instructed_by, instructed_at, inspector_id, status, overall_result, notes, submitted_at, manager_decision, decision_by, decision_at, decision_notes) VALUES
 (1, 2, NOW() - INTERVAL '8 days', 3, 'submitted', 'sesuai', 'Seluruh karung utuh, kadar air 11.8%, berat tepat 100 kg.', NOW() - INTERVAL '8 days', 'accepted', 2, NOW() - INTERVAL '8 days', 'Sesuai standar, transaksi barang masuk disetujui.'),
 (2, 2, NOW() - INTERVAL '1 day',  3, 'submitted', 'sesuai', 'Kadar air 12.0%, berat aktual cocok untuk kedua item. Foto terlampir.', NOW() - INTERVAL '4 hours', NULL, NULL, NULL, NULL);

INSERT INTO inspection_items (inspection_id, product_id, ordered_qty, actual_qty, result, notes) VALUES
 (1, 1, 100, 100, 'sesuai', ''),
 (2, 2, 40,  40,  'sesuai', ''),
 (2, 5, 20,  20,  'sesuai', '');

INSERT INTO inspection_photos (inspection_id, image_url, caption, uploaded_by) VALUES
 (1, '/proof-sample.svg', 'Bukti penimbangan & kadar air SHP-1', 3),
 (2, '/proof-sample.svg', 'Bukti pemeriksaan fisik SHP-2', 3);

-- 9. INVENTORY TRANSACTIONS (IN & OUT)
-- TRX-1: IN Approved dari PO-1 -> stok +100 kg, PO otomatis Received
-- TRX-2: IN Pending dari PO-2 (hasil pemeriksaan Sesuai -> diajukan Staff -> menunggu konfirmasi Manager)
-- TRX-3: OUT Shipped ke Komorebi Specialty Roastery -> stok -20 kg (dipotong saat Shipped!)
-- TRX-4: OUT Pending dari Staff Ahmad Fauzi Ali ke Kroma Coffee -> menunggu persetujuan Manager (stok belum berubah)
INSERT INTO inventory_transactions (trx_number, type, trx_date, inspection_id, supply_order_id, shipment_id, supplier_id, recipient_name, destination, notes, proof_image_url, status, created_by, approved_by, decided_at, shipped_at, shipped_by) VALUES
 ('TRX-IN-'  || to_char(CURRENT_DATE - 8, 'YYYYMMDD') || '-' || lpad(nextval('seq_trx_in')::text,  4, '0'), 'IN',  CURRENT_DATE - 8, 1,    1,    1,    1,    NULL,                          NULL,                             'Penerimaan barang masuk dari pengiriman SHP-1 (hasil pemeriksaan sesuai).', '/proof-sample.svg', 'approved', 3, 2,    NOW() - INTERVAL '8 days', NULL,                      NULL),
 ('TRX-IN-'  || to_char(CURRENT_DATE,     'YYYYMMDD') || '-' || lpad(nextval('seq_trx_in')::text,  4, '0'), 'IN',  CURRENT_DATE,     2,    2,    2,    2,    NULL,                          NULL,                             'Hasil pemeriksaan SHP-2 sesuai, siap ditempatkan di Silo A2 & C1.',           '/proof-sample.svg', 'pending',  3, NULL, NULL,                      NULL,                      NULL),
 ('TRX-OUT-' || to_char(CURRENT_DATE - 4, 'YYYYMMDD') || '-' || lpad(nextval('seq_trx_out')::text, 4, '0'), 'OUT', CURRENT_DATE - 4, NULL, NULL, NULL, NULL, 'Komorebi Specialty Roastery', 'Jl. Dago No. 45, Bandung',       'Distribusi Arabika Gayo mingguan.',                                         '/proof-sample.svg', 'shipped',  3, 2,    NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 3),
 ('TRX-OUT-' || to_char(CURRENT_DATE,     'YYYYMMDD') || '-' || lpad(nextval('seq_trx_out')::text, 4, '0'), 'OUT', CURRENT_DATE,     NULL, NULL, NULL, NULL, 'Kroma Coffee & Roasters',     'Jl. Pettarani No. 18, Makassar', 'Pesanan Robusta Dampit untuk espresso blend.',                              NULL,                'pending',  3, NULL, NULL,                      NULL,                      NULL);

INSERT INTO inventory_transaction_items (transaction_id, product_id, quantity) VALUES
 (1, 1, 100),
 (2, 2, 40), (2, 5, 20),
 (3, 1, 20),
 (4, 3, 30);

-- 10. STOCK MOVEMENTS
INSERT INTO stock_movements (product_id, transaction_id, movement_type, quantity_change, stock_before, stock_after, actor_id, notes, created_at) VALUES
 (1, 1, 'IN',  100,  40, 140, 2, 'Persetujuan barang masuk dari PO-1 (Received)',          NOW() - INTERVAL '8 days'),
 (1, 3, 'OUT', -20, 140, 120, 3, 'Pengiriman barang keluar ke Komorebi Roastery (Shipped)', NOW() - INTERVAL '3 days');

-- 11. NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, link) VALUES
 (1, 'Pendaftaran Supplier Baru',    'Koperasi Kopi Kintamani Bali mendaftar sebagai supplier dan menunggu verifikasi.', '/suppliers'),
 (4, 'Restock Order (PO) Baru',      'Manager Gudang mengirim Restock Order 50 kg Excelsa Jember Natural.',              '/supply-orders/4'),
 (2, 'Barang Masuk Menunggu',        'Staff Ahmad Fauzi Ali mengajukan catatan Barang Masuk (60 kg) dari hasil pemeriksaan PO-2.', '/transactions/2'),
 (2, 'Pengiriman Tiba di Gudang',    'Pengiriman Robusta Dampit Fine dari Koperasi Gayo telah tiba. Tugaskan Staff.',     '/supply-orders/3'),
 (2, 'Barang Keluar Menunggu',       'Staff Ahmad Fauzi Ali mengajukan pengeluaran 30 kg Robusta Dampit ke Kroma Coffee.',          '/transactions/4'),
 (3, 'Pantau Persetujuan OUT',       'Transaksi barang keluar ke Kroma Coffee sedang menunggu persetujuan Manager.',      '/transactions/out');

-- 12. ACTIVITY LOGS
INSERT INTO activity_logs (actor_id, actor_role, action, entity_type, entity_id, summary, created_at) VALUES
 (2, 'manager',  'create_supply_order',  'supply_order', 1, 'Zahrana Kumayla Irfan membuat Restock Order 100 kg Arabika Gayo Grade 1 ke Koperasi Gayo.', NOW() - INTERVAL '10 days'),
 (4, 'supplier', 'confirm_supply_order', 'supply_order', 1, 'Prabowo Susanto mengonfirmasi Restock Order PO-1.',                                           NOW() - INTERVAL '9 days'),
 (3, 'staff',    'submit_inspection',    'inspection',   1, 'Ahmad Fauzi Ali mengirim laporan pemeriksaan SHP-1 (Hasil: Sesuai).',                           NOW() - INTERVAL '8 days'),
 (2, 'manager',  'approve_in',           'transaction',  1, 'Zahrana Kumayla Irfan menyetujui transaksi barang masuk (+100 kg, PO-1 menjadi Received).',  NOW() - INTERVAL '8 days'),
 (2, 'manager',  'approve_out',          'transaction',  3, 'Zahrana Kumayla Irfan menyetujui transaksi barang keluar ke Komorebi (siap packing).',           NOW() - INTERVAL '4 days'),
 (3, 'staff',    'ship_out',             'transaction',  3, 'Ahmad Fauzi Ali mengirim barang ke Komorebi (Shipped, stok -20 kg).',                         NOW() - INTERVAL '3 days'),
 (3, 'staff',    'submit_inspection',    'inspection',   2, 'Ahmad Fauzi Ali mengirim laporan pemeriksaan SHP-2 (Hasil: Sesuai).',                           NOW() - INTERVAL '4 hours'),
 (2, 'manager',  'create_supply_order',  'supply_order', 4, 'Zahrana Kumayla Irfan membuat Restock Order 50 kg Excelsa Jember Natural ke Koperasi Gayo.',     NOW() - INTERVAL '1 hour');

COMMIT;
