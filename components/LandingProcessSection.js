'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './icons.js';

const SOURCING_STEPS = [
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
];

const DISTRIBUTION_STEPS = [
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
];

const TABS = [
  { id: 'sourcing', label: 'Pengadaan dari Petani' },
  { id: 'distribution', label: 'Distribusi ke Roastery' },
];

export function LandingProcessSection() {
  const [flow, setFlow] = useState('sourcing');
  const steps = flow === 'sourcing' ? SOURCING_STEPS : DISTRIBUTION_STEPS;

  return (
    <section id="process" className="relative border-t border-[#e8e6dd] py-24 sm:py-32">
      <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
        <div data-gsap-reveal className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-[560px]">
            <p className="text-[11px] font-medium uppercase tracking-[1.8px] text-[#9b6b08]">Supply Chain Process</p>
            <h2 className="mt-3 text-[30px] font-normal leading-[1.18] tracking-[-0.025em] text-lobeans-forest sm:text-[42px]">
              Satu alur presisi, dari kebun hingga{' '}
              <span className="font-editorial text-[1.08em] italic text-lobeans-forest">roastery.</span>
            </h2>
            <p className="mt-3.5 text-[14.5px] font-light leading-relaxed text-lobeans-muted sm:text-[15.5px]">
              Setiap tahap perjalanan biji kopi dijaga dengan standar mutu tinggi agar kualitas rasa tetap konsisten dari panen hingga cangkir pelanggan.
            </p>
          </div>

          {/* iOS Segmented Control dengan sliding pill Motion layoutId */}
          <div
            role="tablist"
            aria-label="Pilih alur bisnis kopi"
            className="inline-grid shrink-0 grid-cols-2 rounded-full border border-[#e3e1d6] bg-[#efede4] p-1"
          >
            {TABS.map((tab) => {
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
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-lobeans-forest shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editorial Timeline — bersih tanpa kotak card */}
        <div className="mt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={flow}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
            >
              {steps.map((s, idx) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
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
