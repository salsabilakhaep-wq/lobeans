'use client';

import Link from 'next/link';
import { Suspense, useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth.js';
import { Icon } from '@/components/icons.js';

function LoginCard() {
  const [state, formAction, pending] = useActionState(loginAction, {});
  const [showPw, setShowPw] = useState(false);
  const searchParams = useSearchParams();
  const okMsg = searchParams.get('ok');

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-7 rounded-[26px] bg-white px-8 py-12 shadow-xl sm:px-12 sm:py-14 lg:px-14">
      <div>
        <h2 className="text-[24px] font-bold tracking-[-0.01em] text-lobeans-ink sm:text-[26px]">Masuk ke LOBEANS</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-lobeans-muted">
          Gunakan akun supplier yang telah terdaftar untuk mengelola pasokan dan memantau pengiriman Anda.
        </p>
      </div>

      {okMsg && (
        <div
          role="status"
          className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12.5px] font-medium text-emerald-900"
        >
          {okMsg}
        </div>
      )}

      {state.message && (
        <div
          role="alert"
          className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] font-medium text-red-800"
        >
          {state.message}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[12px] font-bold text-lobeans-ink-light">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@perusahaan.com"
            defaultValue={state.values?.email ?? ''}
            className="h-[50px] rounded-[10px] border border-lobeans-border bg-lobeans-cream-light px-4 text-[13px] text-lobeans-ink placeholder:text-[#96a094] focus:border-lobeans-mustard focus:outline-none focus:ring-2 focus:ring-lobeans-mustard/20"
          />
          {state.errors?.email && <p className="text-[11px] font-medium text-red-600">{state.errors.email}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[12px] font-bold text-lobeans-ink-light">
            Kata sandi
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="Masukkan kata sandi Anda"
              className="h-[50px] w-full rounded-[10px] border border-lobeans-border bg-lobeans-cream-light px-4 pr-12 text-[13px] text-lobeans-ink placeholder:text-[#96a094] focus:border-lobeans-mustard focus:outline-none focus:ring-2 focus:ring-lobeans-mustard/20"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
              title={showPw ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#284c35] transition-colors hover:bg-black/5 hover:text-lobeans-ink"
            >
              <Icon name={showPw ? 'eye-off' : 'eye'} className="h-[18px] w-[18px]" />
            </button>
          </div>
          {state.errors?.password && <p className="text-[11px] font-medium text-red-600">{state.errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 h-[48px] w-full rounded-full bg-lobeans-mustard text-[13.5px] font-bold text-lobeans-forest transition-all hover:bg-lobeans-mustard-hover active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? 'Memproses…' : 'Masuk'}
        </button>
      </form>

      <div className="border-t border-[#eeede6] pt-5 text-center">
        <p className="text-[12.5px] text-lobeans-muted">
          Belum memiliki akun supplier?{' '}
          <Link href="/register" className="font-bold text-[#284c35] hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-lobeans-mustard-frame p-4 sm:p-6 lg:p-8">
      <div className="flex min-h-[600px] w-full max-w-[1375px] flex-col items-center overflow-hidden rounded-[22px] bg-lobeans-forest lg:min-h-[700px] lg:flex-row lg:items-stretch">
        {/* Panel Brand */}
        <div className="flex w-full shrink-0 flex-col justify-between px-8 py-10 sm:px-12 lg:w-[535px] lg:px-16 lg:py-14">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-bold tracking-[0.78px] text-lobeans-cream sm:text-[26px]">LOBEANS</span>
              <span className="h-2 w-2 rounded-full bg-lobeans-mustard" />
            </div>
            <p className="mt-1 text-[9.5px] font-semibold tracking-[1.2px] text-lobeans-sage">
              SMART INVENTORY, BETTER COFFEE.
            </p>
          </div>

          <div className="mt-14 lg:mt-0">
            <div className="mb-6 h-[3px] w-[42px] rounded-full bg-lobeans-mustard" />
            <h1 className="text-[32px] font-bold leading-[1.28] tracking-[-0.02em] text-lobeans-cream sm:text-[40px] lg:text-[44px]">
              Kelola pasokan
              <br />
              kopi dengan
              <br />
              lebih terukur.
            </h1>
            <p className="mt-5 max-w-[440px] text-[13.5px] leading-[24px] text-lobeans-sage">
              Platform manajemen gudang dan kemitraan supplier green bean terpadu — dari permintaan pasokan, pemeriksaan kualitas, hingga distribusi harian.
            </p>
          </div>

          <div className="mt-14 lg:mt-0">
            <p className="text-[11px] font-semibold text-lobeans-cream/85">LOBEANS © 2026</p>
            <p className="mt-1 text-[10px] text-lobeans-sage">Coffee Inventory &amp; Supply Chain Platform</p>
          </div>
        </div>

        {/* Kartu Login */}
        <div className="flex w-full flex-1 items-center justify-center p-4 sm:p-8 lg:w-auto lg:p-12">
          <Suspense fallback={<div className="h-[460px] w-full max-w-[560px] rounded-[26px] bg-white" />}>
            <LoginCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
