'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LANDING_MOTION_CONFIG, LANDING_PROCESS_CONFIG } from '@/lib/landingConfig.js';
import { Icon } from './icons.js';

/**
 * Seksi Process dengan tab interaktif bergaya iOS Segmented Control (Motion).
 * Daftar tab dan langkah alur bisnis diatur terpusat di `src/lib/landingConfig.js`.
 */
export function LandingProcessSection() {
  const cfg = LANDING_PROCESS_CONFIG;
  const { ease, spring } = LANDING_MOTION_CONFIG.motion;

  const [flow, setFlow] = useState(cfg.tabs[0].id);
  const steps = cfg.stepsByTab[flow] || [];

  return (
    <section id="process" className="relative border-t border-[#e8e6dd] py-24 sm:py-32">
      <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
        <div data-gsap-reveal className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-[560px]">
            <p className="text-[11px] font-medium uppercase tracking-[1.8px] text-[#9b6b08]">{cfg.eyebrow}</p>
            <h2 className="mt-3 text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-lobeans-forest sm:text-[42px]">
              {cfg.titlePrefix}{' '}
              <span className="font-editorial text-[1.08em] italic text-lobeans-forest">{cfg.titleItalic}</span>
            </h2>
            <p className="mt-3.5 text-[14.5px] font-light leading-relaxed text-lobeans-muted sm:text-[15.5px]">
              {cfg.subtitle}
            </p>
          </div>

          {/* iOS Segmented Control */}
          <div
            role="tablist"
            aria-label="Pilih alur bisnis kopi"
            className="inline-grid shrink-0 grid-cols-2 rounded-full border border-[#e3e1d6] bg-[#efede4] p-1"
          >
            {cfg.tabs.map((tab) => {
              const active = flow === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFlow(tab.id)}
                  className={`relative rounded-full px-4 py-2.5 text-[12px] font-medium transition-colors sm:px-5 sm:text-[12.5px] ${
                    active ? 'text-lobeans-cream' : 'text-lobeans-muted hover:text-lobeans-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="process-active-tab"
                      transition={spring}
                      className="absolute inset-0 rounded-full bg-lobeans-forest shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Editorial 4 Langkah */}
        <div className="mt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={flow}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease }}
              className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
            >
              {steps.map((s, idx) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.06, ease }}
                  className="group relative border-t border-[#dedcd2] pt-6 transition-colors duration-300 hover:border-lobeans-mustard"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-[4.5px] left-0 h-2 w-2 rounded-full bg-lobeans-forest transition-transform duration-300 group-hover:scale-125 group-hover:bg-lobeans-mustard"
                  />

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] font-medium text-[#9b6b08]">{s.step}</span>
                    <span className="text-[11px] font-normal text-lobeans-muted">{s.badge}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2.5 text-lobeans-forest">
                    <Icon name={s.icon} className="h-4 w-4 shrink-0 text-lobeans-mustard" />
                    <span className="text-[11.5px] font-medium text-lobeans-forest/80">{s.stage}</span>
                  </div>

                  <h3 className="mt-3 text-[17px] font-medium leading-snug tracking-[-0.015em] text-lobeans-ink">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] font-light leading-[1.75] text-[#54645a]">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
