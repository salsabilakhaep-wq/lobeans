'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { LANDING_MOTION_CONFIG } from '@/lib/landingConfig.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Pembungkus animasi scroll Landing Page (Lenis + GSAP ScrollTrigger).
 * Seluruh angka durasi, offset, dan kekuatan parallax diatur di `src/lib/landingConfig.js`.
 */
export function LandingMotionShell({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Hormati pengaturan aksesibilitas sistem pengguna (kurangi gerakan)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const { lenis: lenisCfg, gsap: gsapCfg } = LANDING_MOTION_CONFIG;

    // 1. Inisialisasi Lenis (smooth scroll) & sinkronisasi ke ticker GSAP
    const lenis = new Lenis({
      duration: lenisCfg.duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: lenisCfg.touchMultiplier,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // 2. Tangkap klik link anchor (#home..#origin) agar digulir halus oleh Lenis
    const onAnchorClick = (e) => {
      const anchor = e.target.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: lenisCfg.anchorOffset, duration: lenisCfg.anchorDuration });
    };
    root.addEventListener('click', onAnchorClick);

    // 3. Animasi GSAP ScrollTrigger berbasis atribut data-*
    const ctx = gsap.context(() => {
      // Parallax latar foto Hero
      const heroBg = root.querySelector('[data-gsap-hero-bg]');
      if (heroBg) {
        gsap.to(heroBg, {
          yPercent: gsapCfg.heroParallaxY,
          scale: gsapCfg.heroParallaxScale,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: gsapCfg.heroScrub,
          },
        });
      }

      // Kemunculan blok konten saat masuk layar
      gsap.utils.toArray('[data-gsap-reveal]').forEach((el) => {
        gsap.from(el, {
          y: gsapCfg.revealOffsetY,
          opacity: 0,
          duration: gsapCfg.revealDuration,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: gsapCfg.revealStart,
            once: true,
          },
        });
      });

      // Kemunculan item grid/daftar secara bergantian (stagger)
      gsap.utils.toArray('[data-gsap-stagger]').forEach((group) => {
        const items = group.querySelectorAll('[data-gsap-item]');
        if (!items.length) return;
        gsap.from(items, {
          y: gsapCfg.revealOffsetY,
          opacity: 0,
          duration: gsapCfg.staggerDuration,
          stagger: gsapCfg.staggerDelay,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: group,
            start: gsapCfg.revealStart,
            once: true,
          },
        });
      });

      // Gerak halus watermark "LOBEANS" di bawah footer
      const watermark = root.querySelector('[data-gsap-watermark]');
      if (watermark) {
        gsap.fromTo(
          watermark,
          { yPercent: gsapCfg.watermarkOffsetY, opacity: 0.25 },
          {
            yPercent: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: watermark,
              start: 'top bottom',
              end: 'bottom bottom',
              scrub: 1,
            },
          },
        );
      }
    }, root);

    // 4. Bersihkan seluruh listener & instance saat keluar dari halaman
    return () => {
      root.removeEventListener('click', onAnchorClick);
      ctx.revert();
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-screen overflow-x-clip bg-lobeans-cream-light text-lobeans-ink selection:bg-lobeans-mustard/30 selection:text-lobeans-forest"
    >
      {children}
    </div>
  );
}
