'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './icons.js';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'about', label: 'About', href: '#about' },
  { id: 'features', label: 'Features', href: '#features' },
  { id: 'process', label: 'Process', href: '#process' },
  { id: 'origin', label: 'Origin', href: '#origin' },
];

export function LandingNavbar({ isLoggedIn = false }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState('home');

  useEffect(() => {
    const updateScrollState = () => {
      const y = window.scrollY;
      const nextScrolled = y > 72;
      setIsScrolled(nextScrolled);
      if (nextScrolled) setMobileOpen(false);

      // Scroll-spy akurat untuk seluruh 5 seksi termasuk Origin (seksi terakhir)
      const docHeight = document.documentElement.scrollHeight;
      if (y + window.innerHeight >= docHeight - 140) {
        setActiveId('origin');
        return;
      }

      const probe = y + Math.min(260, window.innerHeight * 0.35);
      let current = 'home';
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.offsetTop <= probe) {
          current = item.id;
        }
      }
      setActiveId(current);
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const isCompact = isScrolled && !isHovered && !mobileOpen;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center px-4 pt-4 sm:pt-5">
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Navigasi utama LOBEANS"
        onMouseEnter={() => {
          if (isScrolled) setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        className={`pointer-events-auto relative isolate flex items-center rounded-full border border-white/22 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_42px_-12px_rgba(10,24,18,0.42)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled ? 'bg-[#13291f]/70' : 'bg-[#13291f]/46'
        } ${isCompact ? 'gap-2 px-3.5 py-2' : 'gap-2 px-2.5 py-2 sm:gap-3 sm:px-3'}`}
      >
        {/* Logo LOBEANS (inti kapsul saat mengecil) */}
        <a
          href="#home"
          onClick={(e) => {
            if (isCompact) {
              e.preventDefault();
              setIsHovered(true);
            } else {
              setActiveId('home');
            }
          }}
          aria-label="LOBEANS — Kembali ke atas"
          className="flex shrink-0 items-center gap-2 rounded-full px-1.5 py-0.5 transition-transform duration-300 active:scale-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.svg"
            alt="Logo LOBEANS"
            width={30}
            height={30}
            className="h-[30px] w-[30px] shrink-0 rounded-full ring-1 ring-white/20"
          />
          <span
            className={`flex items-center gap-1.5 overflow-hidden whitespace-nowrap font-medium tracking-[0.8px] text-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isCompact ? 'max-w-[120px] pr-1 text-[13.5px] opacity-100' : 'max-w-[120px] text-[13px] opacity-100 md:max-w-0 md:opacity-0'
            }`}
          >
            LOBEANS
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lobeans-mustard" />
          </span>
        </a>

        {/* Menu Navigasi Desktop — semua tombol (Home..Origin) responsif hover & active */}
        <div
          aria-hidden={isCompact}
          className={`hidden items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex ${
            isCompact
              ? 'pointer-events-none max-w-0 scale-95 opacity-0'
              : 'max-w-[580px] scale-100 gap-1 opacity-100'
          }`}
        >
          {NAV_ITEMS.map((item) => {
            const active = activeId === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                tabIndex={isCompact ? -1 : 0}
                onClick={() => setActiveId(item.id)}
                className={`relative shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] transition-all duration-200 ${
                  active
                    ? 'font-medium text-white'
                    : 'font-normal text-white/78 hover:bg-white/12 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="lobeans-nav-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="pointer-events-none absolute inset-0 z-0 rounded-full bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.26)]"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </a>
            );
          })}
        </div>

        {/* Tombol CTA Kanan (Sign in / Dashboard) */}
        <div
          aria-hidden={isCompact}
          className={`hidden items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex ${
            isCompact
              ? 'pointer-events-none max-w-0 scale-95 opacity-0'
              : 'max-w-[160px] scale-100 pl-1 opacity-100'
          }`}
        >
          <Link
            href={isLoggedIn ? '/dashboard' : '/login'}
            tabIndex={isCompact ? -1 : 0}
            className="inline-flex h-[34px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-white/92 px-4 text-[12.5px] font-medium text-lobeans-forest shadow-xs backdrop-blur-md transition-all duration-200 hover:bg-lobeans-mustard hover:text-lobeans-forest active:scale-[0.97]"
          >
            {isLoggedIn ? 'Dashboard' : 'Sign in'}
          </Link>
        </div>

        {/* Tombol Menu Mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Buka menu navigasi"
          aria-expanded={mobileOpen}
          className={`flex h-8 items-center justify-center overflow-hidden rounded-full text-white transition-all duration-400 md:hidden ${
            isCompact ? 'pointer-events-none w-0 opacity-0' : 'w-8 bg-white/14 opacity-100'
          }`}
        >
          <Icon name={mobileOpen ? 'x' : 'menu'} className="h-4 w-4" />
        </button>
      </motion.nav>

      {/* Dropdown Glass iOS untuk Mobile dengan Motion */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto mt-2.5 w-full max-w-[320px] rounded-[24px] border border-white/22 bg-[#13291f]/74 p-3 text-white shadow-2xl backdrop-blur-2xl backdrop-saturate-150 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = activeId === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setActiveId(item.id);
                      setMobileOpen(false);
                    }}
                    className={`rounded-2xl px-4 py-2.5 text-[13px] transition-colors ${
                      active ? 'bg-white/20 font-medium text-white' : 'font-normal text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
            <div className="mt-2.5 border-t border-white/14 pt-2.5">
              <Link
                href={isLoggedIn ? '/dashboard' : '/login'}
                onClick={() => setMobileOpen(false)}
                className="flex h-[40px] w-full items-center justify-center rounded-full bg-white/92 text-[13px] font-medium text-lobeans-forest transition-colors hover:bg-lobeans-mustard"
              >
                {isLoggedIn ? 'Buka Dashboard' : 'Masuk ke LOBEANS'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
