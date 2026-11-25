'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { registerSupplierAction } from '@/app/actions/auth.js';
import { Icon } from '@/components/icons.js';
import { ImageUploadField } from '@/components/ImageUploadField.js';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerSupplierAction, {});
  const [showPw, setShowPw] = useState(false);

  const fieldCls =
    'h-[46px] w-full rounded-[10px] border border-lobeans-border bg-lobeans-cream-light px-3.5 text-[13px] text-lobeans-ink placeholder:text-[#96a094] focus:border-lobeans-mustard focus:outline-none focus:ring-2 focus:ring-lobeans-mustard/20';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-lobeans-forest p-4 sm:p-6 lg:p-10">
      {/* Latar belakang Hero Botanical LOBEANS (seragam dengan Login Page) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-lobeans.svg"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1d15]/68 via-[#13291f]/46 to-[#0b1b13]/76" />
      </div>

      <div className="relative z-10 flex w-full max-w-[1280px] flex-col items-center overflow-hidden rounded-[28px] border border-white/15 bg-[#13291f]/42 shadow-[0_36px_80px_-24px_rgba(0,0,0,0.62)] backdrop-blur-xl lg:flex-row lg:items-stretch">
        {/* Panel Brand */}
        <div className="flex w-full shrink-0 flex-col justify-between px-8 py-10 sm:px-12 lg:w-[460px] lg:px-14 lg:py-14">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-90">
              <span className="text-[22px] font-semibold tracking-[0.78px] text-lobeans-cream sm:text-[25px]">LOBEANS</span>
              <span className="h-2 w-2 rounded-full bg-lobeans-mustard" />
            </Link>
            <p className="mt-1 text-[9.5px] font-medium tracking-[1.4px] text-white/70">
              SMART INVENTORY, BETTER COFFEE.
            </p>
          </div>

          <div className="mt-12 lg:mt-0">
            <div className="mb-6 h-[3px] w-[42px] rounded-full bg-lobeans-mustard" />
            <h1 className="text-[30px] font-medium leading-[1.24] tracking-[-0.025em] text-white sm:text-[38px]">
              Bergabung sebagai
              <br />
              mitra supplier
              <br />
              <span className="font-editorial text-[1.12em] font-normal italic text-lobeans-mustard">LOBEANS.</span>
            </h1>
            <p className="mt-5 text-[13px] font-light leading-[23px] text-white/80">
              Daftarkan koperasi, kelompok tani, atau usaha green bean Anda. Setelah diverifikasi oleh tim kami, Anda dapat menerima permintaan pasokan dan memantau pengiriman secara langsung.
            </p>
          </div>

          <div className="mt-12 lg:mt-0">
            <p className="text-[11px] font-medium text-white/85">LOBEANS © 2026</p>
            <p className="mt-1 text-[10px] font-light text-white/65">Coffee Inventory &amp; Supply Chain Platform</p>
          </div>
        </div>

        {/* Kartu Pendaftaran Supplier */}
        <div className="flex w-full flex-1 items-center justify-center p-4 sm:p-8 lg:p-10">
          <div className="flex w-full max-w-[660px] flex-col gap-6 rounded-[26px] bg-white px-7 py-10 shadow-xl sm:px-11 sm:py-12">
            <div>
              <h2 className="text-[23px] font-bold tracking-[-0.01em] text-lobeans-ink sm:text-[26px]">
                Daftar Akun Supplier
              </h2>
              <p className="mt-1 text-[12.5px] text-lobeans-muted">
                Lengkapi data usaha dan kontak Anda. Akun akan aktif setelah disetujui oleh Admin LOBEANS.
              </p>
            </div>

            {state.message && (
              <div
                role="alert"
                className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] font-medium text-red-800"
              >
                {state.message}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="company_name" className="mb-1.5 block text-[12px] font-bold text-lobeans-ink-light">
                    Nama Perusahaan / Koperasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="company_name"
                    name="company_name"
                    required
                    placeholder="Mis. Koperasi Kopi Gayo"
                    defaultValue={state.values?.company_name ?? ''}
                    className={fieldCls}
                  />
                  {state.errors?.company_name && <p className="mt-1 text-[11px] text-red-600">{state.errors.company_name}</p>}
                </div>
                <div>
                  <label htmlFor="contact_name" className="mb-1.5 block text-[12px] font-bold text-lobeans-ink-light">
                    Nama Penanggung Jawab <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact_name"
                    name="contact_name"
                    required
                    placeholder="Nama lengkap PIC"
                    defaultValue={state.values?.contact_name ?? ''}
                    className={fieldCls}
                  />
                  {state.errors?.contact_name && <p className="mt-1 text-[11px] text-red-600">{state.errors.contact_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[12px] font-bold text-lobeans-ink-light">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="kontak@koperasi.co.id"
                    defaultValue={state.values?.email ?? ''}
                    className={fieldCls}
                  />
                  {state.errors?.email && <p className="mt-1 text-[11px] text-red-600">{state.errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-[12px] font-bold text-lobeans-ink-light">
                    Nomor Telepon / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    required
                    placeholder="0812-xxxx-xxxx"
                    defaultValue={state.values?.phone ?? ''}
                    className={fieldCls}
                  />
                  {state.errors?.phone && <p className="mt-1 text-[11px] text-red-600">{state.errors.phone}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="address" className="mb-1.5 block text-[12px] font-bold text-lobeans-ink-light">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  required
                  placeholder="Kecamatan, Kabupaten/Kota, Provinsi"
                  defaultValue={state.values?.address ?? ''}
                  className={fieldCls}
                />
                {state.errors?.address && <p className="mt-1 text-[11px] text-red-600">{state.errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[12px] font-bold text-lobeans-ink-light">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="Minimal 8 karakter"
                      className={`${fieldCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                      title={showPw ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#284c35] transition-colors hover:bg-black/5 hover:text-lobeans-ink"
                    >
                      <Icon name={showPw ? 'eye-off' : 'eye'} className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                  {state.errors?.password && <p className="mt-1 text-[11px] text-red-600">{state.errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="confirm_password" className="mb-1.5 block text-[12px] font-bold text-lobeans-ink-light">
                    Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Ulangi kata sandi"
                    className={fieldCls}
                  />
                  {state.errors?.confirm_password && (
                    <p className="mt-1 text-[11px] text-red-600">{state.errors.confirm_password}</p>
                  )}
                </div>
              </div>

              <div className="rounded-[12px] border border-[#e5e4dc] bg-[#faf9f5] p-3.5">
                <ImageUploadField
                  name="document"
                  label="Dokumen Profil / Legalitas Usaha"
                  hint="Unggah foto SIUP / NIB / surat keterangan koperasi atau kelompok tani (JPG/PNG/WEBP)."
                  required
                  error={state.errors?.document}
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="mt-2 h-[48px] w-full rounded-full bg-lobeans-mustard text-[13.5px] font-bold text-lobeans-forest transition-all hover:bg-lobeans-mustard-hover active:scale-[0.99] disabled:opacity-60"
              >
                {pending ? 'Mengirim pendaftaran…' : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="space-y-2.5 border-t border-[#eeede6] pt-4 text-center">
              <p className="text-[12.5px] text-lobeans-muted">
                Sudah memiliki akun supplier?{' '}
                <Link href="/login" className="font-bold text-[#284c35] hover:underline">
                  Masuk sekarang
                </Link>
              </p>
              <p className="text-[12px]">
                <Link href="/" className="font-semibold text-lobeans-muted transition-colors hover:text-lobeans-forest hover:underline">
                  ← Kembali ke Beranda LOBEANS
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
