'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1];

export function LandingHeroContent({ isLoggedIn = false }) {
  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
      {/* Announcement Pill Transparan ala iOS */}
      <motion.a
        href="#origin"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 pr-3.5 text-[12px] font-normal text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl transition-colors hover:border-lobeans-mustard/60 hover:bg-white/16"
      >
        <span className="rounded-full bg-lobeans-mustard px-2.5 py-0.5 text-[10.5px] font-medium tracking-wide text-lobeans-forest">
          New
        </span>
        <span>Kemitraan Green Bean Nusantara Terpercaya</span>
        <span aria-hidden="true" className="text-white/65">
          ›
        </span>
      </motion.a>

      {/* Headline: Smart Inventory (ramping), Better (bold), Coffee. (Times New Roman Italic) */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
        className="mt-5 text-[42px] font-normal leading-[1.08] tracking-[-0.03em] text-white sm:text-[60px] lg:text-[70px]"
      >
        Smart Inventory,
        <br />
        <span className="font-bold tracking-[-0.035em] text-white">Better </span>
        <span className="font-editorial inline-block text-[1.08em] font-normal italic tracking-normal text-lobeans-mustard">
          Coffee.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
        className="mt-4 max-w-[560px] text-[14.5px] font-light leading-[1.8] text-white/84 sm:text-[15.5px]"
      >
        Menghubungkan hasil panen terbaik petani Nusantara dengan standar penyimpanan gudang presisi — menjaga kesegaran, kadar air, dan ketersediaan biji kopi untuk bisnis roastery Anda.
      </motion.p>

      {/* CTA Buttons dengan micro-interaction Motion */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Link
            href={isLoggedIn ? '/dashboard' : '/login'}
            className="inline-flex h-[46px] items-center gap-2 rounded-full bg-lobeans-mustard px-7 text-[13.5px] font-medium text-lobeans-forest shadow-[0_14px_30px_-8px_rgba(221,153,11,0.52)] transition-colors hover:bg-lobeans-mustard-hover"
          >
            {isLoggedIn ? 'Buka Dashboard' : 'Mulai Sekarang'}
            <span aria-hidden="true">→</span>
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
          <Link
            href="/register"
            className="inline-flex h-[46px] items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-[13.5px] font-normal text-white backdrop-blur-xl transition-colors hover:border-white/40 hover:bg-white/18"
          >
            Daftar Mitra Supplier
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
