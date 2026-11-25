'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { LANDING_HERO_CONFIG, LANDING_MOTION_CONFIG } from '@/lib/landingConfig.js';

/**
 * Konten utama Hero Section dengan animasi masuk bertahap (Motion).
 * Seluruh teks, label tombol, dan kurva animasi diatur di `src/lib/landingConfig.js`.
 */
export function LandingHeroContent({ isLoggedIn = false }) {
  const hero = LANDING_HERO_CONFIG;
  const { ease } = LANDING_MOTION_CONFIG.motion;

  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
      {/* Announcement Pill Transparan ala iOS */}
      <motion.a
        href={hero.announcementHref}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 pr-3.5 text-[12px] font-normal text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl transition-colors hover:border-lobeans-mustard/60 hover:bg-white/16"
      >
        <span className="rounded-full bg-lobeans-mustard px-2.5 py-0.5 text-[10.5px] font-medium tracking-wide text-lobeans-forest">
          {hero.announcementTag}
        </span>
        <span>{hero.announcementText}</span>
        <span aria-hidden="true" className="text-white/65">
          ›
        </span>
      </motion.a>

      {/* Headline: Baris 1 ramping, kata Better bold, kata Coffee. Times New Roman Italic */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.08, ease }}
        className="mt-5 text-[42px] font-normal leading-[1.08] tracking-[-0.03em] text-white sm:text-[60px] lg:text-[70px]"
      >
        {hero.headlineLine1}
        <br />
        <span className="font-bold tracking-[-0.035em] text-white">{hero.headlineBold} </span>
        <span className="font-editorial inline-block text-[1.08em] font-normal italic tracking-normal text-lobeans-mustard">
          {hero.headlineItalic}
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.16, ease }}
        className="mt-4 max-w-[560px] text-[14.5px] font-light leading-[1.8] text-white/84 sm:text-[15.5px]"
      >
        {hero.subtitle}
      </motion.p>

      {/* Tombol CTA dengan micro-interaction Motion */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.24, ease }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Link
            href={isLoggedIn ? '/dashboard' : '/login'}
            className="inline-flex h-[46px] items-center gap-2 rounded-full bg-lobeans-mustard px-7 text-[13.5px] font-medium text-lobeans-forest shadow-[0_14px_30px_-8px_rgba(221,153,11,0.52)] transition-colors hover:bg-lobeans-mustard-hover"
          >
            {isLoggedIn ? hero.primaryCtaAuth : hero.primaryCtaGuest}
            <span aria-hidden="true">→</span>
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Link
            href="/register"
            className="inline-flex h-[46px] items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-[13.5px] font-normal text-white backdrop-blur-xl transition-colors hover:border-white/40 hover:bg-white/18"
          >
            {hero.secondaryCta}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
