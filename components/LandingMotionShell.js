'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function LandingMotionShell({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    // 1. Lenis Smooth Scroll tersinkronisasi penuh dengan GSAP ScrollTrigger
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const onTick = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Smooth anchor navigation via Lenis
    const onAnchorClick = (e) => {
      const anchor = e.target.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -72, duration: 1.15 });
    };
    root.addEventListener('click', onAnchorClick);

    // 2. GSAP ScrollTrigger Animations (parallax hero, editorial reveal, stagger, watermark)
    const ctx = gsap.context(() => {
      const heroBg = root.querySelector('[data-gsap-hero-bg]');
      if (heroBg) {
        gsap.to(heroBg, {
          yPercent: 14,
          scale: 1.07,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.7,
          },
        });
      }

      const heroDevices = root.querySelector('[data-gsap-hero-devices]');
      if (heroDevices) {
        gsap.to(heroDevices, {
          y: -26,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.9,
          },
        });
      }

      gsap.utils.toArray('[data-gsap-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 28,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            once: true,
          },
        });
      });

      gsap.utils.toArray('[data-gsap-stagger]').forEach((group) => {
        const items = group.querySelectorAll('[data-gsap-item]');
        if (!items.length) return;
        gsap.from(items, {
          y: 26,
          opacity: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: group,
            start: 'top 85%',
            once: true,
          },
        });
      });

      const watermark = root.querySelector('[data-gsap-watermark]');
      if (watermark) {
        gsap.fromTo(
          watermark,
          { yPercent: 24, opacity: 0.25 },
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

    return () => {
      root.removeEventListener('click', onAnchorClick);
      ctx.revert();
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-clip bg-lobeans-cream-light text-lobeans-ink selection:bg-lobeans-mustard/30 selection:text-lobeans-forest">
      {children}
    </div>
  );
}
