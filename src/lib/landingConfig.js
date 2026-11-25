/**
 * ============================================================================
 * KONFIGURASI TERPUSAT LANDING PAGE LOBEANS
 * ============================================================================
 * Ubah parameter di file ini untuk menyesuaikan teks, link, gambar,
 * kecepatan scroll (Lenis), kekuatan parallax/reveal (GSAP), maupun
 * animasi spring (Motion) tanpa perlu mengedit banyak file komponen.
 * ============================================================================
 */

/* ── 1. PARAMETER ANIMASI (LENIS + GSAP + MOTION) ── */
export const LANDING_MOTION_CONFIG = {
  // Pengaturan Smooth Scroll (Lenis)
  lenis: {
    duration: 1.15,        // Durasi kelembutan scroll (detik). Makin besar = makin halus/lambat.
    touchMultiplier: 1.4,  // Sensitivitas scroll pada layar sentuh.
    anchorOffset: -72,     // Jarak ruang atas (px) saat klik menu navbar agar judul tidak tertutup.
    anchorDuration: 1.15,  // Durasi meluncur (detik) saat klik link menu (#about, #origin, dll).
  },

  // Pengaturan Animasi Scroll (GSAP + ScrollTrigger)
  gsap: {
    heroParallaxY: 14,       // Pergeseran vertikal parallax latar Hero (%).
    heroParallaxScale: 1.07, // Pembesaran halus latar Hero saat di-scroll.
    heroScrub: 0.7,          // Kehalusan sinkronisasi parallax terhadap scroll (detik).
    revealOffsetY: 28,       // Jarak geser awal (px) sebelum elemen muncul.
    revealDuration: 0.85,    // Lama animasi kemunculan tiap blok (detik).
    revealStart: 'top 86%',  // Titik posisi layar saat animasi mulai berjalan.
    staggerDelay: 0.08,      // Jeda antar item (detik) pada daftar/grid.
    staggerDuration: 0.75,   // Lama animasi kemunculan per item.
    watermarkOffsetY: 24,    // Jarak naik watermark "LOBEANS" di footer (%).
  },

  // Pengaturan Transisi UI (Motion / motion/react)
  motion: {
    ease: [0.22, 1, 0.36, 1], // Kurva easing lembut khas iOS.
    spring: {
      type: 'spring',
      stiffness: 420,         // Kekakuan pegas indikator pill aktif.
      damping: 34,            // Redaman pegas (makin besar = makin tidak memantul).
    },
  },
};

/* ── 2. PARAMETER NAVBAR KAPSUL DINAMIS ── */
export const LANDING_NAV_CONFIG = {
  shrinkScrollY: 72,         // Jarak scroll (px) sebelum navbar mengecil menyisakan logo LOBEANS.
  bottomOriginThreshold: 140,// Jarak dari bawah halaman (px) agar menu "Origin" otomatis aktif.
  logoSrc: '/logo-mark.svg',
  brandName: 'LOBEANS',
  ctaGuestLabel: 'Sign in',
  ctaAuthLabel: 'Dashboard',
  items: [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'about', label: 'About', href: '#about' },
    { id: 'features', label: 'Features', href: '#features' },
    { id: 'process', label: 'Process', href: '#process' },
    { id: 'origin', label: 'Origin', href: '#origin' },
  ],
};

/* ── 3. KONTEN HERO SECTION (#home) ── */
export const LANDING_HERO_CONFIG = {
  backgroundImage: '/hero-lobeans.svg',
  announcementTag: 'New',
  announcementText: 'Kemitraan Green Bean Nusantara Terpercaya',
  announcementHref: '#origin',
  headlineLine1: 'Smart Inventory,',
  headlineBold: 'Better',
  headlineItalic: 'Coffee.',
  subtitle:
    'Menghubungkan hasil panen terbaik petani Nusantara dengan standar penyimpanan gudang presisi — menjaga kesegaran, kadar air, dan ketersediaan biji kopi untuk bisnis roastery Anda.',
  primaryCtaGuest: 'Mulai Sekarang',
  primaryCtaAuth: 'Buka Dashboard',
  secondaryCta: 'Daftar Mitra Supplier',
};

/* ── 4. KONTEN ABOUT SECTION (#about) ── */
export const LANDING_ABOUT_CONFIG = {
  eyebrow: 'About LOBEANS',
  titlePrefix: 'Standar baru bisnis distribusi',
  titleItalic: 'green bean Nusantara.',
  descriptionBrand: 'LOBEANS',
  descriptionBody:
    'hadir untuk menjembatani koperasi petani kopi unggulan dengan pelaku industri roastery dan kedai kopi. Kami memastikan setiap karung biji kopi melewati seleksi mutu ketat, tersimpan di ruang berstandar presisi, dan selalu siap memasok kebutuhan roasting harian Anda secara konsisten.',
  metrics: [
    { value: '4', label: 'Origin Nusantara' },
    { value: '~12%', label: 'Standar Kadar Air' },
    { value: '100%', label: 'Traceable Koperasi' },
    { value: '24 Jam', label: 'Respons Pasokan' },
  ],
  pillars: [
    {
      code: '01',
      title: 'Kemitraan Langsung Petani',
      desc: 'Bekerja sama langsung dengan koperasi dan kelompok tani pilihan di Gayo, Toraja, Dampit, Temanggung, Jambi, hingga Jember.',
    },
    {
      code: '02',
      title: 'Kualitas Panen Terverifikasi',
      desc: 'Setiap kiriman melewati pengecekan berat aktual, keseragaman biji, dan dokumentasi mutu sebelum dinyatakan layak masuk penyimpanan.',
    },
    {
      code: '03',
      title: 'Penyimpanan Terukur & Segar',
      desc: 'Pengelolaan silo dan rak penyimpanan yang tertata menjaga aroma alami dan kesegaran green bean tetap optimal hingga waktu sangrai.',
    },
    {
      code: '04',
      title: 'Pasokan Andal untuk Roastery',
      desc: 'Ketersediaan setiap varietas terpantau berkelanjutan sehingga roastery dan kedai kopi dapat menjaga konsistensi menu andalannya.',
    },
  ],
};

/* ── 5. KONTEN FEATURES / KEUNGGULAN BISNIS (#features) ── */
export const LANDING_FEATURES_CONFIG = {
  eyebrow: 'Why LOBEANS',
  titlePrefix: 'Keunggulan bisnis yang menjaga kualitas',
  titleItalic: 'setiap seduhan.',
  subtitle:
    'Dari pemilihan kebun hingga pengantaran ke roastery, setiap standar kami dirancang untuk melindungi margin, konsistensi rasa, dan kelancaran operasional bisnis kopi Anda.',
  items: [
    {
      icon: 'box',
      tag: 'Supply Reliability',
      title: 'Ketersediaan Pasokan Stabil',
      desc: 'Perencanaan pengadaan terukur memastikan varietas green bean favorit Anda selalu tersedia sepanjang musim tanpa mengganggu jadwal produksi.',
    },
    {
      icon: 'clipboard',
      tag: 'Quality Assurance',
      title: 'Jaminan Mutu & Kadar Air',
      desc: 'Setiap lot kopi yang tiba melewati seleksi fisik, pengecekan defect, dan kontrol kadar air ketat agar karakter rasa selalu konsisten.',
    },
    {
      icon: 'shield',
      tag: 'Direct Origin',
      title: 'Transparansi Asal Kebun',
      desc: 'Setiap karung biji kopi tercatat jelas asal daerah, varietas, metode pascapanen, hingga koperasi penghasilnya untuk nilai jual produk Anda.',
    },
    {
      icon: 'alert',
      tag: 'Zero-Risk Supply',
      title: 'Jaminan Retur & Penggantian Adil',
      desc: 'Apabila kualitas atau kuantitas kiriman tidak sesuai standar kesepakatan, proses retur dan penyelesaian ditangani cepat dan transparan.',
    },
    {
      icon: 'truck',
      tag: 'Fast Fulfillment',
      title: 'Distribusi Tepat Waktu',
      desc: 'Pengemasan rapi dengan verifikasi serah terima memastikan biji kopi tiba aman, kering, dan segar di pintu roastery atau kedai Anda.',
    },
    {
      icon: 'chart',
      tag: 'Fair Partnership',
      title: 'Kemitraan Berkelanjutan',
      desc: 'Membuka jaringan kemitraan jangka panjang yang saling menguntungkan antara koperasi petani lokal dan pelaku industri kopi nasional.',
    },
  ],
};

/* ── 6. KONTEN PROCESS WORKFLOW (#process) ── */
export const LANDING_PROCESS_CONFIG = {
  eyebrow: 'Supply Chain Process',
  titlePrefix: 'Satu alur presisi, dari kebun hingga',
  titleItalic: 'roastery.',
  subtitle:
    'Setiap tahap perjalanan biji kopi dijaga dengan standar mutu tinggi agar kualitas rasa tetap konsisten dari panen hingga cangkir pelanggan.',
  tabs: [
    { id: 'sourcing', label: 'Pengadaan dari Petani' },
    { id: 'distribution', label: 'Distribusi ke Roastery' },
  ],
  stepsByTab: {
    sourcing: [
      {
        step: '01',
        stage: 'Perencanaan Pasokan',
        badge: 'Direct Sourcing',
        title: 'Kurasi Kebutuhan Varietas & Kuantitas',
        desc: 'Menentukan varietas green bean, grade mutu, dan volume panen yang dibutuhkan agar ketersediaan kopi selalu sesuai permintaan pasar.',
        icon: 'clipboard',
      },
      {
        step: '02',
        stage: 'Koperasi & Petani Mitra',
        badge: 'Panen Terpilih',
        title: 'Pengiriman Langsung dari Kebun',
        desc: 'Koperasi mitra di Gayo, Toraja, Dampit, hingga Jambi mengirimkan lot kopi pilihan dengan dokumentasi pengiriman dan kedatangan yang jelas.',
        icon: 'truck',
      },
      {
        step: '03',
        stage: 'Kontrol Kualitas',
        badge: 'Kadar Air ~12%',
        title: 'Pemeriksaan Fisik & Standar Mutu',
        desc: 'Setiap karung yang tiba dicek berat aktual, aroma, kebersihan defect, serta kadar airnya agar konsistensi rasa tetap terjaga.',
        icon: 'check',
      },
      {
        step: '04',
        stage: 'Penyimpanan Presisi',
        badge: 'Siap Distribusi',
        title: 'Masuk Silo Terstandar atau Retur Adil',
        desc: 'Biji kopi yang lolos seleksi langsung disimpan pada rak/silo khusus; kiriman di bawah standar ditangani dengan jaminan retur transparan.',
        icon: 'box',
      },
    ],
    distribution: [
      {
        step: '01',
        stage: 'Permintaan Roastery',
        badge: 'Flexible Order',
        title: 'Pemesanan Sesuai Profil Roasting',
        desc: 'Roastery dan kedai kopi memilih varietas, metode proses, dan volume green bean yang paling cocok untuk kebutuhan produksi mereka.',
        icon: 'arrowUp',
      },
      {
        step: '02',
        stage: 'Jaminan Ketersediaan',
        badge: 'Verified Stock',
        title: 'Konfirmasi Lot & Kesegaran Biji',
        desc: 'Tim operasional memastikan lot kopi tersedia dalam kondisi prima sebelum tahap pengemasan dimulai agar pengiriman bebas kendala.',
        icon: 'shield',
      },
      {
        step: '03',
        stage: 'Pengemasan Aman',
        badge: 'Karung Terlabel',
        title: 'Sortasi Ulang & Pengemasan Rapi',
        desc: 'Setiap karung diberi label asal kebun dan identitas lot yang jelas untuk melindungi kualitas aroma kopi selama perjalanan.',
        icon: 'box',
      },
      {
        step: '04',
        stage: 'Pengiriman Terjaga',
        badge: 'On-Time Delivery',
        title: 'Tiba Tepat Waktu di Pintu Roastery',
        desc: 'Pengiriman terdokumentasi dengan bukti serah terima sehingga mitra bisnis menerima biji kopi segar tepat sesuai jadwal roasting.',
        icon: 'chart',
      },
    ],
  },
};

/* ── 7. KONTEN ORIGIN & KATEGORI KOPI (#origin) ── */
export const LANDING_ORIGIN_CONFIG = {
  eyebrow: 'Indonesian Coffee Origins',
  titlePrefix: 'Empat kategori kopi pilihan',
  titleItalic: 'Nusantara.',
  subtitle: 'Dipanen langsung dari sentra kopi terbaik Indonesia untuk memenuhi ragam karakter roasting bisnis Anda.',
  items: [
    {
      name: 'Arabika',
      region: 'Aceh Gayo & Tana Toraja',
      process: 'Semi-Washed · Wet-Hulled',
      altitude: '1.300 – 1.700 mdpl',
      grade: 'Grade 1 Specialty',
      notes: 'Floral lembut, herbal segar, rempah bersih, dan acidity seimbang khas dataran tinggi Nusantara.',
      image: '/cat-arabika.svg',
    },
    {
      name: 'Robusta',
      region: 'Dampit Malang & Temanggung',
      process: 'Natural · Full Washed',
      altitude: '600 – 1.000 mdpl',
      grade: 'Fine Petik Merah',
      notes: 'Petik merah pilihan dengan karakter dark chocolate, karamel pekat, dan body tebal untuk espresso blend.',
      image: '/cat-robusta.svg',
    },
    {
      name: 'Liberika',
      region: 'Tanjung Jabung, Jambi',
      process: 'Natural · Honey Process',
      altitude: 'Lahan Gambut Pesisir',
      grade: 'Peatland Heritage',
      notes: 'Aroma buah nangka eksotis, manis buah tropis alami, dan aftertaste panjang yang unik.',
      image: '/cat-liberika.svg',
    },
    {
      name: 'Excelsa',
      region: 'Wonosalam & Jember, Jatim',
      process: 'Honey · Natural Process',
      altitude: '700 – 1.100 mdpl',
      grade: 'Highland Rare Lot',
      notes: 'Profil rasa fruity tarty yang cerah dengan sentuhan woody dan rempah kompleks yang berlapis.',
      image: '/cat-excelsa.svg',
    },
  ],
};

/* ── 8. KONTEN CTA PENUTUP & FOOTER ── */
export const LANDING_FOOTER_CONFIG = {
  ctaTitlePrefix: 'Siap bertumbuh bersama mitra pasokan',
  ctaTitleItalic: 'kopi',
  ctaTitleSuffix: 'terpercaya?',
  ctaSubtitle:
    'Bangun rantai pasok green bean yang lebih segar, terukur, dan berkelanjutan bersama LOBEANS untuk bisnis kopi Anda.',
  ctaButtonGuest: 'Mulai Sekarang',
  ctaButtonAuth: 'Buka Dashboard',
  brandDescription:
    'LOBEANS menghadirkan pasokan biji kopi green bean Nusantara berkualitas tinggi dengan standar penyimpanan dan kemitraan yang terpercaya.',
  copyright: '© 2026 LOBEANS. All rights reserved.',
  watermarkText: 'LOBEANS',
  social: {
    github: 'https://github.com/salsabilakhaep-wq/lobeans.git',
    gmail: 'salsabilakhae.p@gmail.com',
    instagram: 'https://www.instagram.com/sllsaspdy?avpt=MW1pc2FwNWdnZW1xbA%3D%3D&utm_source=qr',
    instagramHandle: '@sllsaspdy',
  },
};
