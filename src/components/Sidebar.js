'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from './icons.js';
import { Logo } from './Logo.js';
import { NAV, ROLE_LABEL } from '@/lib/constants.js';
import { logoutAction } from '@/app/actions/auth.js';

/** Cari menu yang paling cocok (prefix terpanjang) agar hanya satu menu aktif. */
function activeHref(items, pathname) {
  let best = null;
  for (const it of items) {
    const match = it.href === '/dashboard' ? pathname === '/dashboard' : pathname === it.href || pathname.startsWith(it.href + '/');
    if (match && (!best || it.href.length > best.length)) best = it.href;
  }
  return best;
}

function NotificationBell({ unreadCount = 0 }) {
  return (
    <Link
      href="/notifications"
      aria-label="Notifikasi"
      className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-lobeans-border bg-white text-lobeans-ink transition-colors hover:border-lobeans-forest/30 hover:bg-[#faf9f5]"
    >
      <Icon name="bell" className="h-[18px] w-[18px]" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

function ProfileChip({ user }) {
  const inner = (
    <>
      <div className="text-right leading-tight">
        <p className="text-[13px] font-bold text-lobeans-ink">{user.name}</p>
        <p className="text-[11px] font-medium text-lobeans-muted">{ROLE_LABEL[user.role]}</p>
      </div>
      <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-lobeans-forest text-lobeans-cream shadow-sm transition-transform group-hover:scale-[1.03]">
        <Icon name="user" className="h-5 w-5" />
      </span>
    </>
  );

  if (user.role === 'supplier') {
    return (
      <Link
        href="/account"
        title="Kelola Akun"
        className="group flex items-center gap-3 rounded-full py-1 pl-2 pr-1 transition-colors hover:bg-black/4"
      >
        {inner}
      </Link>
    );
  }

  return <div className="flex items-center gap-3">{inner}</div>;
}

export function Sidebar({ user, unreadCount = 0 }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV[user.role] || [];
  const current = activeHref(items, pathname);

  const panel = (
    <div className="flex h-full flex-col">
      {/* Ruang logo di atas panel melengkung */}
      <div className="flex h-[104px] shrink-0 items-center bg-[#f7f6f2] px-7">
        <Logo />
      </div>

      {/* Panel hijau melengkung khas LOBEANS */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-tr-[52px] bg-lobeans-forest">
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-6 pt-9">
          <p className="px-3.5 pb-2.5 text-[10px] font-bold uppercase tracking-[1.4px] text-lobeans-sage/65">
            {ROLE_LABEL[user.role]}
          </p>
          {items.map((item) => {
            const active = item.href === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-[12px] px-3.5 py-3 text-[13px] transition-colors ${
                  active
                    ? 'bg-lobeans-mustard font-bold text-lobeans-forest shadow-sm'
                    : 'font-medium text-lobeans-sage hover:bg-white/6 hover:text-white'
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-white/8 px-3 py-2.5 text-[12.5px] font-semibold text-lobeans-cream transition-colors hover:bg-red-500/20 hover:text-red-100"
            >
              <Icon name="logout" className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] lg:block">{panel}</aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-lobeans-border bg-[#f7f6f2]/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-lobeans-ink hover:bg-black/5"
            aria-label="Buka menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <Logo compact />
        </div>
        <div className="flex items-center gap-2.5">
          <NotificationBell unreadCount={unreadCount} />
          {user.role === 'supplier' ? (
            <Link
              href="/account"
              aria-label="Kelola Akun"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-lobeans-forest text-lobeans-cream"
            >
              <Icon name="user" className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lobeans-forest text-lobeans-cream">
              <Icon name="user" className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[270px] max-w-[85%] shadow-2xl">
            {panel}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-lobeans-muted hover:bg-black/5"
              aria-label="Tutup menu"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const TITLES = {
  '/dashboard': 'Dashboard',
  '/users': 'Pengguna & Role',
  '/suppliers': 'Verifikasi & Data Supplier',
  '/products': 'Kelola Produk',
  '/categories': 'Kategori Kopi',
  '/supply-orders': 'Permintaan Pasokan',
  '/shipments': 'Pengiriman Barang',
  '/inspections': 'Pemeriksaan Barang',
  '/transactions/in': 'Barang Masuk (IN)',
  '/transactions/out': 'Barang Keluar (OUT)',
  '/transactions': 'Transaksi Gudang',
  '/reports': 'Laporan & Audit',
  '/notifications': 'Notifikasi',
  '/account': 'Kelola Akun',
};

export function TopBar({ user, today, unreadCount = 0 }) {
  const pathname = usePathname();
  const key = Object.keys(TITLES)
    .filter((k) => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return (
    <header className="hidden h-[104px] items-center justify-between px-10 lg:flex">
      <div className="leading-tight">
        <p className="text-[11px] font-medium text-lobeans-muted">{today}</p>
        <p className="mt-1 text-[16px] font-bold tracking-tight text-lobeans-ink">{TITLES[key] || 'LOBEANS'}</p>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell unreadCount={unreadCount} />
        <ProfileChip user={user} />
      </div>
    </header>
  );
}
