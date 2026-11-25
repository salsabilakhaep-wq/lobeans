-- =====================================================================
--  LOBEANS — Smart Inventory, Better Coffee.
--  DATA DUMMY TAMBAHAN UNTUK DEMO PRESENTASI (ADDITIVE & IDEMPOTENT)
--
--  Aman dijalankan berulang kali di atas database yang sudah berjalan:
--  TIDAK menghapus/menimpa data yang sudah ada.
-- =====================================================================

BEGIN;

DO $$
DECLARE
  v_admin_id      INT;
  v_manager_id    INT;
  v_staff_id      INT;
  v_sup1_user_id  INT;
  v_sup2_user_id  INT;
  v_sup4_id       INT;
  v_sup5_id       INT;
  v_sup4_user_id  INT;
  v_role_sup_id   INT;

  v_cat_arabika   INT;
  v_cat_robusta   INT;
  v_cat_liberika  INT;
  v_cat_excelsa   INT;

  v_prod_flr      INT;
  v_prod_lmp      INT;
  v_prod_mrt      INT;
  v_prod_krc      INT;
  v_prod_gayo     INT;
  v_prod_dampit   INT;

  v_po_id         INT;
  v_shp_id        INT;
  v_insp_id       INT;
  v_trx_id        INT;
BEGIN
  -- Ambil ID referensi utama yang sudah ada
  SELECT id INTO v_admin_id     FROM users WHERE email = 'admin@lobeans.test';
  SELECT id INTO v_manager_id   FROM users WHERE email = 'manager@lobeans.test';
  SELECT id INTO v_staff_id     FROM users WHERE email = 'staff@lobeans.test';
  SELECT id INTO v_sup1_user_id FROM users WHERE email = 'supplier1@lobeans.test';
  SELECT id INTO v_sup2_user_id FROM users WHERE email = 'supplier2@lobeans.test';
  SELECT id INTO v_role_sup_id  FROM roles WHERE code  = 'supplier';

  SELECT id INTO v_cat_arabika  FROM categories WHERE name = 'Arabika';
  SELECT id INTO v_cat_robusta  FROM categories WHERE name = 'Robusta';
  SELECT id INTO v_cat_liberika FROM categories WHERE name = 'Liberika';
  SELECT id INTO v_cat_excelsa  FROM categories WHERE name = 'Excelsa';

  -- ===================================================================
  -- 1. SUPPLIER & AKUN DEMO TAMBAHAN (Password: Supplier123!)
  -- ===================================================================
  INSERT INTO suppliers (supplier_code, company_name, contact_name, phone, email, address, document_url, verification_status, is_active)
  VALUES
    ('SUP-004', 'Koperasi Tani Flores Manggarai',       'Raka Mahendra', '0812-7788-3344', 'supplier4@lobeans.test', 'Ruteng, Manggarai, NTT',        '/proof-sample.svg', 'approved', TRUE),
    ('SUP-005', 'Koperasi Kopi Ijen Raung Bondowoso',   'Nadia Lestari', '0813-5566-2211', 'supplier5@lobeans.test', 'Sempol, Bondowoso, Jawa Timur', '/proof-sample.svg', 'pending',  FALSE)
  ON CONFLICT (supplier_code) DO NOTHING;

  SELECT id INTO v_sup4_id FROM suppliers WHERE supplier_code = 'SUP-004';
  SELECT id INTO v_sup5_id FROM suppliers WHERE supplier_code = 'SUP-005';

  INSERT INTO users (role_id, supplier_id, name, email, password_hash, is_active)
  VALUES
    (v_role_sup_id, v_sup4_id, 'Raka Mahendra', 'supplier4@lobeans.test', '$2b$10$f7B.nlDRoTQl/5hVCf7h5eCCGyfv8WDjvZc9vMQMoQsk4vZVT7Hta', TRUE),
    (v_role_sup_id, v_sup5_id, 'Nadia Lestari', 'supplier5@lobeans.test', '$2b$10$f7B.nlDRoTQl/5hVCf7h5eCCGyfv8WDjvZc9vMQMoQsk4vZVT7Hta', FALSE)
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO v_sup4_user_id FROM users WHERE email = 'supplier4@lobeans.test';

  -- ===================================================================
  -- 2. PRODUK KOPI NUSANTARA TAMBAHAN (4 Varietas Baru: Normal/Low/Severe/Out of Stock)
  -- ===================================================================
  INSERT INTO products (sku, name, category_id, variety, process_method, origin_region, description, buy_price, sell_price, min_stock, low_stock, stock, unit, rack_location, image_url)
  VALUES
    ('ARB-FLR-01', 'Arabika Flores Bajawa Washed',  v_cat_arabika,  'Kartika',  'Full Washed', 'Bajawa, NTT',       'Arabika vulkanik dataran tinggi Flores dengan aroma cokelat susu, floral lembut, dan body medium.', 102000, 148000, 20, 45, 95, 'kg', 'Silo-A3',   '/cat-arabika.svg'),
    ('ROB-LMP-01', 'Robusta Lampung Barat Natural', v_cat_robusta,  'Tugusari', 'Natural',     'Liwa, Lampung',     'Robusta petik merah dengan karakter nutty, cokelat gelap, dan crema tebal untuk espresso blend.',    58000,  84000, 25, 55, 18, 'kg', 'Pallet-B3', '/cat-robusta.svg'),
    ('LIB-MRT-01', 'Liberika Meranti Riau Honey',   v_cat_liberika, 'Liberika', 'Honey',       'Kepulauan Meranti', 'Liberika lahan gambut proses honey dengan manis buah tropis pekat dan aftertaste panjang.',          94000, 138000, 10, 25,  0, 'kg', 'Silo-C3',   '/cat-liberika.svg'),
    ('EXC-KRC-01', 'Excelsa Kerinci Highland',      v_cat_excelsa,  'Excelsa',  'Natural',     'Kerinci, Jambi',    'Excelsa kaki Gunung Kerinci bercitarasa fruity cerah, rempah manis, dan aroma kayu eksotis.',        85000, 124000, 10, 25, 20, 'kg', 'Silo-D3',   '/cat-excelsa.svg')
  ON CONFLICT (sku) DO NOTHING;

  SELECT id INTO v_prod_flr    FROM products WHERE sku = 'ARB-FLR-01';
  SELECT id INTO v_prod_lmp    FROM products WHERE sku = 'ROB-LMP-01';
  SELECT id INTO v_prod_mrt    FROM products WHERE sku = 'LIB-MRT-01';
  SELECT id INTO v_prod_krc    FROM products WHERE sku = 'EXC-KRC-01';
  SELECT id INTO v_prod_gayo   FROM products WHERE sku = 'ARB-GYO-01';
  SELECT id INTO v_prod_dampit FROM products WHERE sku = 'ROB-DMP-01';

  -- ===================================================================
  -- 3. SUPPLY ORDERS (PO) DEMO — SEMUA TAHAP WORKFLOW SIAP DIDEMO
  -- ===================================================================

  -- 3A. PO-DEMO-0001 (PENDING -> Supplier 1 bisa langsung demo Konfirmasi / Tolak PO)
  IF NOT EXISTS (SELECT 1 FROM supply_orders WHERE order_number = 'PO-DEMO-0001') THEN
    INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status)
    VALUES ('PO-DEMO-0001', 1, v_manager_id, CURRENT_DATE, CURRENT_DATE + 5,
            'Permintaan restock mendesak Robusta Lampung Barat (Severe) & Liberika Meranti (Out of Stock).', 'pending')
    RETURNING id INTO v_po_id;

    INSERT INTO supply_order_items (supply_order_id, product_id, quantity) VALUES
      (v_po_id, v_prod_lmp, 60),
      (v_po_id, v_prod_mrt, 35);

    INSERT INTO notifications (user_id, title, message, link)
    VALUES (v_sup1_user_id, 'Restock Order (PO) Baru (PO-DEMO-0001)',
            'Manager Gudang mengirim PO 95 kg. Silakan konfirmasi kesanggupan Anda.', '/supply-orders/' || v_po_id);

    INSERT INTO activity_logs (actor_id, actor_role, action, entity_type, entity_id, summary)
    VALUES (v_manager_id, 'manager', 'create_supply_order', 'supply_order', v_po_id,
            'Manager membuat PO-DEMO-0001 (95 kg) untuk Koperasi Baitul Qiradh Baburrayyan Gayo.');
  END IF;

  -- 3B. PO-DEMO-0002 (CONFIRMED -> Supplier 1 bisa langsung demo Kirim Barang / In Transit)
  IF NOT EXISTS (SELECT 1 FROM supply_orders WHERE order_number = 'PO-DEMO-0002') THEN
    INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status, decision_by, decision_at)
    VALUES ('PO-DEMO-0002', 1, v_manager_id, CURRENT_DATE, CURRENT_DATE + 4,
            'Restock rutin Arabika Flores Bajawa Grade 1 kemasan karung 50 kg, kadar air maks 12%.', 'confirmed',
            v_sup1_user_id, NOW() - INTERVAL '3 hours')
    RETURNING id INTO v_po_id;

    INSERT INTO supply_order_items (supply_order_id, product_id, quantity) VALUES
      (v_po_id, v_prod_flr, 50);

    INSERT INTO activity_logs (actor_id, actor_role, action, entity_type, entity_id, summary)
    VALUES (v_sup1_user_id, 'supplier', 'confirm_supply_order', 'supply_order', v_po_id,
            'Koperasi Gayo mengonfirmasi PO-DEMO-0002 dan siap mengirim 50 kg Arabika Flores Bajawa.');
  END IF;

  -- 3C. PO-DEMO-0003 (IN TRANSIT -> Supplier 2 bisa langsung demo Tandai Barang Tiba / Arrived)
  IF NOT EXISTS (SELECT 1 FROM supply_orders WHERE order_number = 'PO-DEMO-0003') THEN
    INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status, decision_by, decision_at)
    VALUES ('PO-DEMO-0003', 2, v_manager_id, CURRENT_DATE - 1, CURRENT_DATE + 2,
            'Pasokan Excelsa Kerinci Highland 40 kg dalam perjalanan menuju gudang pusat.', 'in_transit',
            v_sup2_user_id, NOW() - INTERVAL '1 day')
    RETURNING id INTO v_po_id;

    INSERT INTO supply_order_items (supply_order_id, product_id, quantity) VALUES
      (v_po_id, v_prod_krc, 40);

    INSERT INTO shipments (shipment_number, supply_order_id, attempt_number, shipment_type, status, shipping_proof_url, notes, shipped_at, created_by)
    VALUES ('SHP-DEMO-0003', v_po_id, 1, 'initial', 'in_transit', '/proof-sample.svg',
            'Dikirim via ekspedisi kargo darat, estimasi tiba hari ini.', NOW() - INTERVAL '10 hours', v_sup2_user_id);
  END IF;

  -- 3D. PO-DEMO-0004 (ARRIVED -> Manager bisa langsung demo Instruksi Pemeriksaan Fisik)
  IF NOT EXISTS (SELECT 1 FROM supply_orders WHERE order_number = 'PO-DEMO-0004') THEN
    INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status, decision_by, decision_at)
    VALUES ('PO-DEMO-0004', v_sup4_id, v_manager_id, CURRENT_DATE - 2, CURRENT_DATE,
            'Pasokan Arabika Flores Bajawa 60 kg dari Koperasi Tani Flores Manggarai.', 'arrived',
            v_sup4_user_id, NOW() - INTERVAL '2 days')
    RETURNING id INTO v_po_id;

    INSERT INTO supply_order_items (supply_order_id, product_id, quantity) VALUES
      (v_po_id, v_prod_flr, 60);

    INSERT INTO shipments (shipment_number, supply_order_id, attempt_number, shipment_type, status, shipping_proof_url, arrival_proof_url, notes, shipped_at, arrived_at, created_by)
    VALUES ('SHP-DEMO-0004', v_po_id, 1, 'initial', 'arrived', '/proof-sample.svg', '/proof-sample.svg',
            'Barang sudah tiba di dock bongkar muat gudang, bukti foto kedatangan terlampir.',
            NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', v_sup4_user_id);

    INSERT INTO notifications (user_id, title, message, link)
    VALUES (v_manager_id, 'Barang Tiba di Gudang (PO-DEMO-0004)',
            'Bukti kedatangan SHP-DEMO-0004 telah diterima. Silakan instruksikan Staff untuk pemeriksaan fisik.', '/supply-orders/' || v_po_id);
  END IF;

  -- 3E. PO-DEMO-0005 (INSPECTING / PENDING -> Staff bisa langsung demo Form Pemeriksaan Fisik!)
  IF NOT EXISTS (SELECT 1 FROM supply_orders WHERE order_number = 'PO-DEMO-0005') THEN
    INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status, decision_by, decision_at)
    VALUES ('PO-DEMO-0005', 1, v_manager_id, CURRENT_DATE - 2, CURRENT_DATE,
            'Pasokan Robusta Lampung Barat 50 kg — menunggu pemeriksaan fisik Staff Gudang.', 'inspecting',
            v_sup1_user_id, NOW() - INTERVAL '2 days')
    RETURNING id INTO v_po_id;

    INSERT INTO supply_order_items (supply_order_id, product_id, quantity) VALUES
      (v_po_id, v_prod_lmp, 50);

    INSERT INTO shipments (shipment_number, supply_order_id, attempt_number, shipment_type, status, shipping_proof_url, arrival_proof_url, notes, shipped_at, arrived_at, created_by)
    VALUES ('SHP-DEMO-0005', v_po_id, 1, 'initial', 'inspecting', '/proof-sample.svg', '/proof-sample.svg',
            'Karung telah diturunkan ke area QC, siap diperiksa Staff Gudang.',
            NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 hours', v_sup1_user_id)
    RETURNING id INTO v_shp_id;

    INSERT INTO inspections (shipment_id, instructed_by, instructed_at, status, notes)
    VALUES (v_shp_id, v_manager_id, NOW() - INTERVAL '1 hour', 'pending',
            'Cek kadar air maksimal 12%, pastikan tidak ada karung lembab dan timbang ulang berat bersih 50 kg.');

    INSERT INTO notifications (user_id, title, message, link)
    VALUES (v_staff_id, 'Instruksi Pemeriksaan — PO-DEMO-0005',
            'Manager meminta pemeriksaan fisik untuk SHP-DEMO-0005 (50 kg Robusta Lampung Barat).', '/inspections/' || v_shp_id);
  END IF;

  -- 3F. PO-DEMO-0006 (INSPECTING / SESUAI + TRX-IN PENDING -> Manager bisa langsung demo Konfirmasi IN -> Stok Bertambah!)
  IF NOT EXISTS (SELECT 1 FROM supply_orders WHERE order_number = 'PO-DEMO-0006') THEN
    INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status, decision_by, decision_at)
    VALUES ('PO-DEMO-0006', 2, v_manager_id, CURRENT_DATE - 3, CURRENT_DATE,
            'Restock Liberika Meranti Riau Honey 30 kg untuk memenuhi stok kosong.', 'inspecting',
            v_sup2_user_id, NOW() - INTERVAL '3 days')
    RETURNING id INTO v_po_id;

    INSERT INTO supply_order_items (supply_order_id, product_id, quantity) VALUES
      (v_po_id, v_prod_mrt, 30);

    INSERT INTO shipments (shipment_number, supply_order_id, attempt_number, shipment_type, status, shipping_proof_url, arrival_proof_url, notes, shipped_at, arrived_at, created_by)
    VALUES ('SHP-DEMO-0006', v_po_id, 1, 'initial', 'inspecting', '/proof-sample.svg', '/proof-sample.svg',
            'Pengiriman 30 kg Liberika Meranti Honey utuh dan tersegel.',
            NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours', v_sup2_user_id)
    RETURNING id INTO v_shp_id;

    INSERT INTO inspections (shipment_id, instructed_by, instructed_at, inspector_id, status, overall_result, notes, submitted_at)
    VALUES (v_shp_id, v_manager_id, NOW() - INTERVAL '5 hours', v_staff_id, 'submitted', 'sesuai',
            'Berat aktual 30 kg tepat, kadar air 11.7%, biji bersih tanpa jamur. Siap masuk Silo-C3.', NOW() - INTERVAL '3 hours')
    RETURNING id INTO v_insp_id;

    INSERT INTO inspection_items (inspection_id, product_id, ordered_qty, actual_qty, result, notes)
    VALUES (v_insp_id, v_prod_mrt, 30, 30, 'sesuai', '');

    INSERT INTO inspection_photos (inspection_id, image_url, caption, uploaded_by)
    VALUES (v_insp_id, '/proof-sample.svg', 'Foto penimbangan & uji kadar air SHP-DEMO-0006', v_staff_id);

    INSERT INTO inventory_transactions (trx_number, type, trx_date, inspection_id, supply_order_id, shipment_id, supplier_id, notes, proof_image_url, status, created_by)
    VALUES ('TRX-IN-DEMO-0001', 'IN', CURRENT_DATE, v_insp_id, v_po_id, v_shp_id, 2,
            'Hasil pemeriksaan SHP-DEMO-0006 sesuai, siap masuk stok Silo-C3.', '/proof-sample.svg', 'pending', v_staff_id)
    RETURNING id INTO v_trx_id;

    INSERT INTO inventory_transaction_items (transaction_id, product_id, quantity)
    VALUES (v_trx_id, v_prod_mrt, 30);

    INSERT INTO notifications (user_id, title, message, link)
    VALUES (v_manager_id, 'Barang Masuk Menunggu Persetujuan (TRX-IN-DEMO-0001)',
            'Staff Ahmad Fauzi Ali mengajukan penerimaan 30 kg Liberika Meranti (PO-DEMO-0006).', '/transactions/' || v_trx_id);
  END IF;

  -- 3G. PO-DEMO-0007 (INSPECTING / TIDAK SESUAI -> Manager bisa langsung demo Retur & Klaim Refund!)
  IF NOT EXISTS (SELECT 1 FROM supply_orders WHERE order_number = 'PO-DEMO-0007') THEN
    INSERT INTO supply_orders (order_number, supplier_id, created_by, order_date, expected_date, notes, status, decision_by, decision_at)
    VALUES ('PO-DEMO-0007', v_sup4_id, v_manager_id, CURRENT_DATE - 3, CURRENT_DATE,
            'Restock Excelsa Kerinci Highland 35 kg kemasan karung goni berlapis.', 'inspecting',
            v_sup4_user_id, NOW() - INTERVAL '3 days')
    RETURNING id INTO v_po_id;

    INSERT INTO supply_order_items (supply_order_id, product_id, quantity) VALUES
      (v_po_id, v_prod_krc, 35);

    INSERT INTO shipments (shipment_number, supply_order_id, attempt_number, shipment_type, status, shipping_proof_url, arrival_proof_url, notes, shipped_at, arrived_at, created_by)
    VALUES ('SHP-DEMO-0007', v_po_id, 1, 'initial', 'inspecting', '/proof-sample.svg', '/proof-sample.svg',
            'Pengiriman tiba dengan 1 karung bagian bawah lembab.',
            NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 hours', v_sup4_user_id)
    RETURNING id INTO v_shp_id;

    INSERT INTO inspections (shipment_id, instructed_by, instructed_at, inspector_id, status, overall_result, notes, submitted_at)
    VALUES (v_shp_id, v_manager_id, NOW() - INTERVAL '3 hours', v_staff_id, 'submitted', 'tidak_sesuai',
            'Ditemukan 1 karung bocor/lembab, berat layak hanya 22 kg dari 35 kg pesanan & kadar air 15.2%. Direkomendasikan retur.', NOW() - INTERVAL '2 hours')
    RETURNING id INTO v_insp_id;

    INSERT INTO inspection_items (inspection_id, product_id, ordered_qty, actual_qty, result, notes)
    VALUES (v_insp_id, v_prod_krc, 35, 22, 'tidak_sesuai', '1 karung lembab dan kurang timbangan');

    INSERT INTO inspection_photos (inspection_id, image_url, caption, uploaded_by)
    VALUES (v_insp_id, '/proof-sample.svg', 'Bukti foto karung lembab & hasil ukur kadar air SHP-DEMO-0007', v_staff_id);

    INSERT INTO notifications (user_id, title, message, link)
    VALUES (v_manager_id, 'Laporan Pemeriksaan Tidak Sesuai (PO-DEMO-0007)',
            'Hasil pemeriksaan Staff: Tidak Sesuai. Silakan tolak penerimaan (Returned) & ajukan klaim refund.', '/supply-orders/' || v_po_id);
  END IF;

  -- ===================================================================
  -- 4. TRANSAKSI BARANG KELUAR (OUT) DEMO
  -- ===================================================================

  -- 4A. OUT Pending (siap demo Staff Edit/Hapus & Manager Approve/Reject)
  IF NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE trx_number = 'TRX-OUT-DEMO-0001') THEN
    INSERT INTO inventory_transactions (trx_number, type, trx_date, recipient_name, destination, notes, status, created_by)
    VALUES ('TRX-OUT-DEMO-0001', 'OUT', CURRENT_DATE,
            'Anomali Coffee Roasters', 'Jl. Kemang Raya No. 72, Jakarta Selatan',
            'Permintaan rutin Arabika Flores Bajawa & Arabika Gayo untuk batch roasting mingguan.', 'pending', v_staff_id)
    RETURNING id INTO v_trx_id;

    INSERT INTO inventory_transaction_items (transaction_id, product_id, quantity) VALUES
      (v_trx_id, v_prod_flr,  15),
      (v_trx_id, v_prod_gayo, 20);

    INSERT INTO notifications (user_id, title, message, link)
    VALUES (v_manager_id, 'Barang Keluar Menunggu Persetujuan (TRX-OUT-DEMO-0001)',
            'Staff mengajukan pengeluaran 35 kg untuk Anomali Coffee Roasters.', '/transactions/' || v_trx_id);
  END IF;

  -- 4B. OUT Approved (siap demo Staff Kirim Barang -> Shipped -> stok berkurang otomatis!)
  IF NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE trx_number = 'TRX-OUT-DEMO-0002') THEN
    INSERT INTO inventory_transactions (trx_number, type, trx_date, recipient_name, destination, notes, status, created_by, approved_by, decided_at)
    VALUES ('TRX-OUT-DEMO-0002', 'OUT', CURRENT_DATE,
            'Tanamera Coffee Roastery', 'Jl. Thamrin City Boulevard, Jakarta Pusat',
            'Pengiriman Robusta Dampit Fine kemasan karung 25 kg — sudah disetujui Manager, siap packing & kirim.',
            'approved', v_staff_id, v_manager_id, NOW() - INTERVAL '1 hour')
    RETURNING id INTO v_trx_id;

    INSERT INTO inventory_transaction_items (transaction_id, product_id, quantity) VALUES
      (v_trx_id, v_prod_dampit, 25);

    INSERT INTO notifications (user_id, title, message, link)
    VALUES (v_staff_id, 'Barang Keluar Disetujui (TRX-OUT-DEMO-0002)',
            'Silakan packing 25 kg Robusta Dampit untuk Tanamera Coffee, unggah foto bukti kirim, lalu klik Shipped.', '/transactions/' || v_trx_id);
  END IF;

  -- 4C. OUT Shipped historis (memperkaya laporan & buku besar mutasi stok)
  IF NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE trx_number = 'TRX-OUT-DEMO-0003') THEN
    INSERT INTO inventory_transactions (trx_number, type, trx_date, recipient_name, destination, notes, proof_image_url, status, created_by, approved_by, decided_at, shipped_at, shipped_by)
    VALUES ('TRX-OUT-DEMO-0003', 'OUT', CURRENT_DATE - 1,
            'Seniman Coffee Studio', 'Jl. Sri Wedari No. 5, Ubud, Bali',
            'Pengiriman Arabika Flores Bajawa untuk seasonal single origin.', '/proof-sample.svg',
            'shipped', v_staff_id, v_manager_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours', v_staff_id)
    RETURNING id INTO v_trx_id;

    INSERT INTO inventory_transaction_items (transaction_id, product_id, quantity) VALUES
      (v_trx_id, v_prod_flr, 15);

    INSERT INTO stock_movements (product_id, transaction_id, movement_type, quantity_change, stock_before, stock_after, actor_id, notes, created_at)
    VALUES (v_prod_flr, v_trx_id, 'OUT', -15, 110, 95, v_staff_id,
            'Pengiriman TRX-OUT-DEMO-0003 ke Seniman Coffee Studio (Shipped)', NOW() - INTERVAL '20 hours');
  END IF;

  -- Notifikasi pendaftaran supplier baru untuk Admin
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = v_admin_id AND message LIKE '%Ijen Raung%') THEN
    INSERT INTO notifications (user_id, title, message, link)
    VALUES (v_admin_id, 'Pendaftaran Supplier Baru',
            'Koperasi Kopi Ijen Raung Bondowoso (Nadia Lestari) mendaftar sebagai mitra supplier dan menunggu verifikasi.', '/suppliers');
  END IF;
END $$;

COMMIT;
