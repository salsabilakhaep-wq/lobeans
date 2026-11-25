import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth.js';
import {
  LANDING_ABOUT_CONFIG,
  LANDING_FEATURES_CONFIG,
  LANDING_FOOTER_CONFIG,
  LANDING_HERO_CONFIG,
  LANDING_NAV_CONFIG,
  LANDING_ORIGIN_CONFIG,
} from '@/lib/landingConfig.js';
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

/**
 * Halaman Utama (Landing Page) LOBEANS.
 * Seluruh teks, metrik, link sosial, dan parameter animasi dapat diubah terpusat di `src/lib/landingConfig.js`.
 */
export default async function LandingPage() {
  const user = await getCurrentUser();
  const isLoggedIn = Boolean(user);

  const hero = LANDING_HERO_CONFIG;
  const about = LANDING_ABOUT_CONFIG;
  const features = LANDING_FEATURES_CONFIG;
  const origin = LANDING_ORIGIN_CONFIG;
  const footer = LANDING_FOOTER_CONFIG;
  const nav = LANDING_NAV_CONFIG;

  return (
    <LandingMotionShell>
      {/* Navbar Kapsul Transparan ala iOS */}
      <LandingNavbar isLoggedIn={isLoggedIn} />

      <main>
        {/* ═══════════════════ 1. HOME / HERO SECTION ═══════════════════ */}
        <section
          id="home"
          className="relative flex min-h-[88vh] items-center overflow-hidden rounded-b-[36px] bg-lobeans-forest pb-20 pt-28 shadow-[0_26px_60px_-28px_rgba(14,31,23,0.45)] sm:min-h-[92vh] sm:rounded-b-[52px] sm:pb-24 sm:pt-32"
        >
          {/* Latar Hero dengan Parallax GSAP */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-gsap-hero-bg
              src={hero.backgroundImage}
              alt=""
              className="h-[112%] w-full -translate-y-[4%] object-cover object-center will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f16]/58 via-[#13291f]/32 to-[#0b1b13]/72" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-col items-center px-5 sm:px-8">
            <LandingHeroContent isLoggedIn={isLoggedIn} />
          </div>
        </section>

        {/* ═══════════════════ 2. ABOUT SECTION ═══════════════════ */}
        <section id="about" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
              <div data-gsap-reveal className="flex flex-col justify-between lg:col-span-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[1.8px] text-[#9b6b08]">{about.eyebrow}</p>
                  <h2 className="mt-3 text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-lobeans-forest sm:text-[42px]">
                    {about.titlePrefix}{' '}
                    <span className="font-editorial text-[1.08em] italic text-[#9b6b08]">{about.titleItalic}</span>
                  </h2>
                  <p className="mt-5 text-[15px] font-light leading-[1.85] text-[#526258]">
                    <span className="font-medium text-lobeans-forest">{about.descriptionBrand}</span> {about.descriptionBody}
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-6 border-t border-[#e4e2d8] pt-8 sm:grid-cols-4">
                  {about.metrics.map((m) => (
                    <div key={m.label}>
                      <p className="text-[26px] font-medium tracking-[-0.02em] text-lobeans-forest tabular-nums">{m.value}</p>
                      <p className="mt-1 text-[11.5px] font-light text-lobeans-muted">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div data-gsap-stagger className="divide-y divide-[#e4e2d8] border-y border-[#e4e2d8] lg:col-span-6">
                {about.pillars.map((item) => (
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

        {/* ═══════════════════ 3. FEATURES SECTION ═══════════════════ */}
        <section id="features" className="relative border-t border-[#e8e6dd] bg-[#f7f5ee]/70 py-24 sm:py-32">
          <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
            <div data-gsap-reveal className="max-w-[620px]">
              <p className="text-[11px] font-medium uppercase tracking-[1.8px] text-[#9b6b08]">{features.eyebrow}</p>
              <h2 className="mt-3 text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-lobeans-forest sm:text-[42px]">
                {features.titlePrefix}{' '}
                <span className="font-editorial text-[1.08em] italic text-lobeans-forest">{features.titleItalic}</span>
              </h2>
              <p className="mt-3.5 text-[14.5px] font-light leading-relaxed text-lobeans-muted sm:text-[15.5px]">
                {features.subtitle}
              </p>
            </div>

            <div data-gsap-stagger className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {features.items.map((f) => (
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

        {/* ═══════════════════ 4. PROCESS SECTION ═══════════════════ */}
        <LandingProcessSection />

        {/* ═══════════════════ 5. ORIGIN SECTION ═══════════════════ */}
        <section id="origin" className="relative border-t border-[#e8e6dd] bg-[#f7f5ee]/70 py-24 sm:py-32">
          <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
            <div data-gsap-reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-[580px]">
                <p className="text-[11px] font-medium uppercase tracking-[1.8px] text-[#9b6b08]">{origin.eyebrow}</p>
                <h2 className="mt-3 text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-lobeans-forest sm:text-[42px]">
                  {origin.titlePrefix}{' '}
                  <span className="font-editorial text-[1.08em] italic text-[#9b6b08]">{origin.titleItalic}</span>
                </h2>
              </div>
              <p className="max-w-[360px] text-[13.5px] font-light leading-relaxed text-lobeans-muted">
                {origin.subtitle}
              </p>
            </div>

            <div data-gsap-stagger className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
              {origin.items.map((o) => (
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
          {/* 1. Banner CTA Gelap dengan Pendar Atas */}
          <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
            <div
              data-gsap-reveal
              className="footer-cta-glow relative overflow-hidden rounded-[32px] px-7 py-20 text-center text-white shadow-[0_32px_70px_-24px_rgba(9,21,15,0.55)] sm:px-14 sm:py-24"
            >
              <div className="relative z-10 mx-auto max-w-[580px]">
                <h2 className="text-[28px] font-medium leading-[1.18] tracking-[-0.025em] text-white sm:text-[40px]">
                  {footer.ctaTitlePrefix}{' '}
                  <span className="font-editorial text-[1.1em] font-normal italic text-lobeans-mustard">
                    {footer.ctaTitleItalic}
                  </span>{' '}
                  {footer.ctaTitleSuffix}
                </h2>
                <p className="mt-4 text-[14px] font-light leading-relaxed text-white/74 sm:text-[15px]">
                  {footer.ctaSubtitle}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={isLoggedIn ? '/dashboard' : '/login'}
                    className="inline-flex h-[44px] items-center justify-center rounded-xl bg-white px-6 text-[13px] font-medium text-lobeans-forest shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-lobeans-mustard"
                  >
                    {isLoggedIn ? footer.ctaButtonAuth : footer.ctaButtonGuest}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Panel Footer Putih + 3. Watermark Besar */}
          <footer className="relative mt-8 overflow-hidden pb-24 sm:mt-10 sm:pb-32">
            <div className="relative z-10 mx-auto max-w-[1140px] px-5 sm:px-8">
              <div className="rounded-[28px] border border-[#e9e7df] bg-white px-7 py-10 shadow-[0_24px_60px_-24px_rgba(19,41,31,0.12)] sm:px-12 sm:py-12">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
                  {/* Brand & Ikon Sosial (GitHub, Gmail, Instagram) */}
                  <div className="md:col-span-5">
                    <a href="#home" className="inline-flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={nav.logoSrc} alt={nav.brandName} width={28} height={28} className="h-7 w-7 rounded-lg" />
                      <span className="flex items-center gap-1 text-[16px] font-medium tracking-[0.4px] text-lobeans-forest">
                        {nav.brandName}
                        <span className="h-1.5 w-1.5 rounded-full bg-lobeans-mustard" />
                      </span>
                    </a>
                    <p className="mt-4 max-w-[330px] text-[13px] font-light leading-[1.7] text-[#66736a]">
                      {footer.brandDescription}
                    </p>

                    <div className="mt-6 flex items-center gap-4 text-lobeans-forest/85">
                      <a
                        href={footer.social.github}
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
                        href={`mailto:${footer.social.gmail}`}
                        aria-label={`Email ${footer.social.gmail}`}
                        title={footer.social.gmail}
                        className="transition-colors hover:text-lobeans-mustard"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[19px] w-[19px]">
                          <rect x="3" y="5" width="18" height="14" rx="2.5" />
                          <path d="m3.5 7 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                      <a
                        href={footer.social.instagram}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram LOBEANS"
                        title={`Instagram ${footer.social.instagramHandle}`}
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
                        {nav.items.slice(0, 4).map((item) => (
                          <li key={item.id}>
                            <a href={item.href} className="transition-colors hover:text-lobeans-forest">
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[12.5px] font-medium text-lobeans-forest">Coffee Origin</p>
                      <ul className="mt-4 space-y-2.5 text-[12.5px] font-light text-[#66736a]">
                        {origin.items.map((o) => (
                          <li key={o.name}>
                            <a href="#origin" className="transition-colors hover:text-lobeans-forest">
                              {o.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[12.5px] font-medium text-lobeans-forest">Kemitraan</p>
                      <ul className="mt-4 space-y-2.5 text-[12.5px] font-light text-[#66736a]">
                        <li><Link href="/login" className="transition-colors hover:text-lobeans-forest">Masuk Mitra</Link></li>
                        <li><Link href="/register" className="transition-colors hover:text-lobeans-forest">Daftar Supplier</Link></li>
                        <li>
                          <a href={footer.social.github} target="_blank" rel="noreferrer" className="transition-colors hover:text-lobeans-forest">
                            GitHub
                          </a>
                        </li>
                        <li>
                          <a href={footer.social.instagram} target="_blank" rel="noreferrer" className="transition-colors hover:text-lobeans-forest">
                            Instagram
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Hak Cipta Terpusat */}
                <div className="mt-10 border-t border-[#eeede6] pt-6 text-center text-[12px] font-light text-[#7a867e]">
                  <p>{footer.copyright}</p>
                </div>
              </div>
            </div>

            {/* Watermark LOBEANS di Bawah Kartu Footer */}
            <div
              aria-hidden="true"
              data-gsap-watermark
              className="pointer-events-none absolute inset-x-0 -bottom-6 z-0 flex select-none justify-center overflow-hidden sm:-bottom-10"
            >
              <span className="whitespace-nowrap text-[clamp(86px,17.5vw,230px)] font-semibold leading-[0.82] tracking-[-0.04em] text-lobeans-forest/[0.06]">
                {footer.watermarkText}
              </span>
            </div>
          </footer>
        </section>
      </main>
    </LandingMotionShell>
  );
}
