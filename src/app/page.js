import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth.js';
import { Icon } from '@/components/icons.js';
import { LandingHeroContent } from '@/components/LandingHeroContent.js';
import { LandingMotionShell } from '@/components/LandingMotionShell.js';
import { LandingNavbar } from '@/components/LandingNavbar.js';
import { LandingProcessSection } from '@/components/LandingProcessSection.js';

export const metadata = {
  title: 'LOBEANS — Smart Inventory, Better Coffee.',
  description:
    'Mitra distribusi dan penyimpanan biji kopi green bean Nusantara terpercaya — menjaga kesegaran panen, standar mutu, dan kestabilan pasokan bagi industri kopi.',
};

const BUSINESS_ADVANTAGES = [
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
];

const BUSINESS_PILLARS = [
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
];

const ORIGINS = [
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
];

const GITHUB_URL = 'https://github.com/salsabilakhaep-wq/lobeans.git';
const INSTAGRAM_URL = 'https://www.instagram.com/sllsaspdy?avpt=MW1pc2FwNWdnZW1xbA%3D%3D&utm_source=qr';
const GMAIL_ADDRESS = 'salsabilakhae.p@gmail.com';

export default async function LandingPage() {
  const user = await getCurrentUser();
  const isLoggedIn = Boolean(user);

  return (
    <LandingMotionShell>
      {/* Navbar Kapsul iOS Transparan (Motion + Scroll Shrink) */}
      <LandingNavbar isLoggedIn={isLoggedIn} />

      <main>
        {/* ═══════════════════ 1. HOME / HERO SECTION (Rounded Bottom Corners) ═══════════════════ */}
        <section
          id="home"
          className="relative flex min-h-[88vh] items-center overflow-hidden rounded-b-[36px] bg-lobeans-forest pb-20 pt-28 shadow-[0_26px_60px_-28px_rgba(14,31,23,0.45)] sm:min-h-[92vh] sm:rounded-b-[52px] sm:pb-24 sm:pt-32"
        >
          {/* Foto Latar Hero Kustom dengan Parallax GSAP */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-gsap-hero-bg
              src="/hero-lobeans.svg"
              alt=""
              className="h-[112%] w-full -translate-y-[4%] object-cover object-center will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f16]/58 via-[#13291f]/32 to-[#0b1b13]/72" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-col items-center px-5 sm:px-8">
            <LandingHeroContent isLoggedIn={isLoggedIn} />
          </div>
        </section>

        {/* ═══════════════════ 2. ABOUT SECTION (Keunggulan Bisnis LOBEANS) ═══════════════════ */}
        <section id="about" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
              {/* Narasi Bisnis Kiri */}
              <div data-gsap-reveal className="flex flex-col justify-between lg:col-span-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[1.8px] text-[#9b6b08]">About LOBEANS</p>
                  <h2 className="mt-3 text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-lobeans-forest sm:text-[42px]">
                    Standar baru bisnis distribusi{' '}
                    <span className="font-editorial text-[1.08em] italic text-[#9b6b08]">green bean Nusantara.</span>
                  </h2>
                  <p className="mt-5 text-[15px] font-light leading-[1.85] text-[#526258]">
                    <span className="font-medium text-lobeans-forest">LOBEANS</span> hadir untuk menjembatani koperasi petani kopi unggulan dengan pelaku industri roastery dan kedai kopi. Kami memastikan setiap karung biji kopi melewati seleksi mutu ketat, tersimpan di ruang berstandar presisi, dan selalu siap memasok kebutuhan roasting harian Anda secara konsisten.
                  </p>
                </div>

                {/* Strip Metrik Bisnis dengan Hairline Divider */}
                <div className="mt-10 grid grid-cols-2 gap-6 border-t border-[#e4e2d8] pt-8 sm:grid-cols-4">
                  {[
                    { value: '4', label: 'Origin Nusantara' },
                    { value: '~12%', label: 'Standar Kadar Air' },
                    { value: '100%', label: 'Traceable Koperasi' },
                    { value: '24 Jam', label: 'Respons Pasokan' },
                  ].map((m) => (
                    <div key={m.label}>
                      <p className="text-[26px] font-medium tracking-[-0.02em] text-lobeans-forest tabular-nums">{m.value}</p>
                      <p className="mt-1 text-[11.5px] font-light text-lobeans-muted">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Pilar Keunggulan Bisnis (Garis Tipis — Bukan Card) */}
              <div data-gsap-stagger className="divide-y divide-[#e4e2d8] border-y border-[#e4e2d8] lg:col-span-6">
                {BUSINESS_PILLARS.map((item) => (
                  <div
                    key={item.title}
                    data-gsap-item
                    className="group grid grid-cols-12 items-baseline gap-4 py-6 transition-colors duration-200 hover:bg-lobeans-forest/[0.02]"
                  >
                    <span className="col-span-2 font-mono text-[12px] font-medium text-[#9b6b08]">{item.code}</span>
                    <div className="col-span-10">
                      <h3 className="text-[16.5px] font-medium text-lobeans-forest">{item.title}</h3>
                      <p className="mt-1.5 text-[13.5px] font-light leading-[1.7] text-[#54645a]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════ 3. FEATURES SECTION (Keunggulan Layanan Bisnis) ═══════════════════ */}
        <section id="features" className="relative border-t border-[#e8e6dd] bg-[#f7f5ee]/70 py-24 sm:py-32">
          <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
            <div data-gsap-reveal className="max-w-[620px]">
              <p className="text-[11px] font-medium uppercase tracking-[1.8px] text-[#9b6b08]">Why LOBEANS</p>
              <h2 className="mt-3 text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-lobeans-forest sm:text-[42px]">
                Keunggulan bisnis yang menjaga kualitas{' '}
                <span className="font-editorial text-[1.08em] italic text-lobeans-forest">setiap seduhan.</span>
              </h2>
              <p className="mt-3.5 text-[14.5px] font-light leading-relaxed text-lobeans-muted sm:text-[15.5px]">
                Dari pemilihan kebun hingga pengantaran ke roastery, setiap standar kami dirancang untuk melindungi margin, konsistensi rasa, dan kelancaran operasional bisnis kopi Anda.
              </p>
            </div>

            <div data-gsap-stagger className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {BUSINESS_ADVANTAGES.map((f) => (
                <article
                  key={f.title}
                  data-gsap-item
                  className="group border-t border-[#dedcd2] pt-6 transition-colors duration-300 hover:border-lobeans-forest"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lobeans-forest/8 text-lobeans-forest transition-colors duration-300 group-hover:bg-lobeans-forest group-hover:text-lobeans-mustard">
                      <Icon name={f.icon} className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-normal tracking-wide text-[#8a6416]">{f.tag}</span>
                  </div>
                  <h3 className="mt-5 text-[17.5px] font-medium tracking-[-0.015em] text-lobeans-ink">{f.title}</h3>
                  <p className="mt-2.5 text-[13.5px] font-light leading-[1.75] text-[#54645a]">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ 4. PROCESS SECTION (Alur Bisnis Kopi) ═══════════════════ */}
        <LandingProcessSection />

        {/* ═══════════════════ 5. ORIGIN SECTION (Asal & Kategori Kopi Nusantara) ═══════════════════ */}
        <section id="origin" className="relative border-t border-[#e8e6dd] bg-[#f7f5ee]/70 py-24 sm:py-32">
          <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
            <div data-gsap-reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-[580px]">
                <p className="text-[11px] font-medium uppercase tracking-[1.8px] text-[#9b6b08]">Indonesian Coffee Origins</p>
                <h2 className="mt-3 text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-lobeans-forest sm:text-[42px]">
                  Empat kategori kopi pilihan{' '}
                  <span className="font-editorial text-[1.08em] italic text-[#9b6b08]">Nusantara.</span>
                </h2>
              </div>
              <p className="max-w-[360px] text-[13.5px] font-light leading-relaxed text-lobeans-muted">
                Dipanen langsung dari sentra kopi terbaik Indonesia untuk memenuhi ragam karakter roasting bisnis Anda.
              </p>
            </div>

            <div data-gsap-stagger className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
              {ORIGINS.map((o) => (
                <article key={o.name} data-gsap-item className="group">
                  <div className="relative h-60 w-full overflow-hidden rounded-[24px] bg-lobeans-forest sm:h-68">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={o.image}
                      alt={`Kategori kopi ${o.name} — ${o.region}`}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-[#13291f]/65 px-3.5 py-1 text-[11px] font-normal text-lobeans-cream backdrop-blur-md">
                      {o.altitude}
                    </span>
                    <span className="absolute bottom-3.5 left-4 text-[11.5px] font-normal tracking-wide text-white/90">
                      {o.grade}
                    </span>
                  </div>

                  {/* Editorial caption langsung di atas kanvas */}
                  <div className="mt-5 px-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e2e0d6] pb-3">
                      <div className="flex items-baseline gap-2.5">
                        <h3 className="text-[22px] font-medium tracking-[-0.02em] text-lobeans-forest">{o.name}</h3>
                        <span className="font-editorial text-[19px] italic text-[#9b6b08]">{o.region}</span>
                      </div>
                      <span className="text-[11.5px] font-light text-lobeans-muted">{o.process}</span>
                    </div>
                    <p className="mt-3 text-[13.5px] font-light leading-[1.75] text-[#54645a]">{o.notes}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ CLOSING CTA & FOOTER ═══════════════════ */}
        <section className="relative overflow-hidden bg-[#f4f2eb] pt-20 sm:pt-24">
          {/* 1. Dark Luminous Top-Glow CTA Banner */}
          <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
            <div
              data-gsap-reveal
              className="footer-cta-glow relative overflow-hidden rounded-[32px] px-7 py-20 text-center text-white shadow-[0_32px_70px_-24px_rgba(9,21,15,0.55)] sm:px-14 sm:py-24"
            >
              <div className="relative z-10 mx-auto max-w-[580px]">
                <h2 className="text-[28px] font-medium leading-[1.18] tracking-[-0.025em] text-white sm:text-[40px]">
                  Siap bertumbuh bersama mitra pasokan{' '}
                  <span className="font-editorial text-[1.1em] font-normal italic text-lobeans-mustard">kopi</span> terpercaya?
                </h2>
                <p className="mt-4 text-[14px] font-light leading-relaxed text-white/74 sm:text-[15px]">
                  Bangun rantai pasok green bean yang lebih segar, terukur, dan berkelanjutan bersama LOBEANS untuk bisnis kopi Anda.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={isLoggedIn ? '/dashboard' : '/login'}
                    className="inline-flex h-[44px] items-center justify-center rounded-xl bg-white px-6 text-[13px] font-medium text-lobeans-forest shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-lobeans-mustard"
                  >
                    {isLoggedIn ? 'Buka Dashboard' : 'Mulai Sekarang'}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Floating White Rounded Footer Panel + 3. Giant Faint Watermark */}
          <footer className="relative mt-8 overflow-hidden pb-24 sm:mt-10 sm:pb-32">
            <div className="relative z-10 mx-auto max-w-[1140px] px-5 sm:px-8">
              <div className="rounded-[28px] border border-[#e9e7df] bg-white px-7 py-10 shadow-[0_24px_60px_-24px_rgba(19,41,31,0.12)] sm:px-12 sm:py-12">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
                  {/* Brand & Deskripsi Kiri */}
                  <div className="md:col-span-5">
                    <a href="#home" className="inline-flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo-mark.svg" alt="LOBEANS" width={28} height={28} className="h-7 w-7 rounded-lg" />
                      <span className="flex items-center gap-1 text-[16px] font-medium tracking-[0.4px] text-lobeans-forest">
                        LOBEANS
                        <span className="h-1.5 w-1.5 rounded-full bg-lobeans-mustard" />
                      </span>
                    </a>
                    <p className="mt-4 max-w-[330px] text-[13px] font-light leading-[1.7] text-[#66736a]">
                      LOBEANS menghadirkan pasokan biji kopi green bean Nusantara berkualitas tinggi dengan standar penyimpanan dan kemitraan yang terpercaya.
                    </p>

                    {/* Hanya 3 Link Resmi: GitHub, Gmail, dan Instagram */}
                    <div className="mt-6 flex items-center gap-4 text-lobeans-forest/85">
                      <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub LOBEANS"
                        title="GitHub LOBEANS"
                        className="transition-colors hover:text-lobeans-mustard"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[19px] w-[19px]">
                          <path
                            d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                      <a
                        href={`mailto:${GMAIL_ADDRESS}`}
                        aria-label={`Email ${GMAIL_ADDRESS}`}
                        title={GMAIL_ADDRESS}
                        className="transition-colors hover:text-lobeans-mustard"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[19px] w-[19px]">
                          <rect x="3" y="5" width="18" height="14" rx="2.5" />
                          <path d="m3.5 7 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram LOBEANS"
                        title="Instagram @sllsaspdy"
                        className="transition-colors hover:text-lobeans-mustard"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[19px] w-[19px]">
                          <rect x="3" y="3" width="18" height="18" rx="5" />
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* 3 Kolom Tautan Kanan */}
                  <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
                    <div>
                      <p className="text-[12.5px] font-medium text-lobeans-forest">Navigasi</p>
                      <ul className="mt-4 space-y-2.5 text-[12.5px] font-light text-[#66736a]">
                        <li><a href="#home" className="transition-colors hover:text-lobeans-forest">Home</a></li>
                        <li><a href="#about" className="transition-colors hover:text-lobeans-forest">About</a></li>
                        <li><a href="#features" className="transition-colors hover:text-lobeans-forest">Features</a></li>
                        <li><a href="#process" className="transition-colors hover:text-lobeans-forest">Process</a></li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-[12.5px] font-medium text-lobeans-forest">Coffee Origin</p>
                      <ul className="mt-4 space-y-2.5 text-[12.5px] font-light text-[#66736a]">
                        <li><a href="#origin" className="transition-colors hover:text-lobeans-forest">Arabika</a></li>
                        <li><a href="#origin" className="transition-colors hover:text-lobeans-forest">Robusta</a></li>
                        <li><a href="#origin" className="transition-colors hover:text-lobeans-forest">Liberika</a></li>
                        <li><a href="#origin" className="transition-colors hover:text-lobeans-forest">Excelsa</a></li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-[12.5px] font-medium text-lobeans-forest">Kemitraan</p>
                      <ul className="mt-4 space-y-2.5 text-[12.5px] font-light text-[#66736a]">
                        <li><Link href="/login" className="transition-colors hover:text-lobeans-forest">Masuk Mitra</Link></li>
                        <li><Link href="/register" className="transition-colors hover:text-lobeans-forest">Daftar Supplier</Link></li>
                        <li>
                          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-lobeans-forest">
                            GitHub
                          </a>
                        </li>
                        <li>
                          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-lobeans-forest">
                            Instagram
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Baris Hak Cipta Bawah — Terpusat */}
                <div className="mt-10 border-t border-[#eeede6] pt-6 text-center text-[12px] font-light text-[#7a867e]">
                  <p>© 2026 LOBEANS. All rights reserved.</p>
                </div>
              </div>
            </div>

            {/* 3. Giant Oversized Watermark Wordmark di Bawah Kartu Footer */}
            <div
              aria-hidden="true"
              data-gsap-watermark
              className="pointer-events-none absolute inset-x-0 -bottom-6 z-0 flex select-none justify-center overflow-hidden sm:-bottom-10"
            >
              <span className="whitespace-nowrap text-[clamp(86px,17.5vw,230px)] font-semibold leading-[0.82] tracking-[-0.04em] text-lobeans-forest/[0.06]">
                LOBEANS
              </span>
            </div>
          </footer>
        </section>
      </main>
    </LandingMotionShell>
  );
}
