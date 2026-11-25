'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons.js';

/**
 * Input unggah foto dengan preview langsung dan tombol "Hapus Foto".
 * Mendukung validasi wajib (required) tanpa fallback otomatis.
 */
export function ImageUploadField({
  name,
  label,
  hint,
  required = false,
  error,
  existingUrl = null,
}) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setPreviewUrl(null);
      setFileName('');
      setFileSize('');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setFileSize(
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    );
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName('');
    setFileSize('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2.5">
      {label && (
        <div>
          <label htmlFor={`file-${name}`} className="block text-[12px] font-bold text-lobeans-ink">
            {label} {required && <span className="text-red-500">* (Wajib)</span>}
          </label>
          {hint && <p className="mt-0.5 text-[11px] text-lobeans-muted">{hint}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id={`file-${name}`}
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp,image/gif"
          required={required}
          onChange={handleChange}
          className="block w-full flex-1 text-[11.5px] text-lobeans-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-lobeans-forest file:px-3.5 file:py-2 file:text-[11.5px] file:font-semibold file:text-lobeans-cream hover:file:bg-lobeans-forest-light"
        />
        {previewUrl && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11.5px] font-bold text-red-700 transition-colors hover:bg-red-100"
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
            Hapus Foto
          </button>
        )}
      </div>

      {previewUrl ? (
        <div className="flex items-center gap-3 rounded-[12px] border border-[#e5e4dc] bg-white p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview foto terpilih"
            className="h-20 w-24 shrink-0 rounded-[8px] border border-[#eeede6] object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-lobeans-ink">{fileName}</p>
            <p className="text-[11px] text-lobeans-muted">{fileSize} · Siap diunggah</p>
          </div>
        </div>
      ) : (
        existingUrl && (
          <div className="flex items-center gap-3 rounded-[12px] border border-[#e5e4dc] bg-white p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={existingUrl}
              alt="Foto tersimpan"
              className="h-16 w-20 shrink-0 rounded-[8px] border border-[#eeede6] object-cover"
            />
            <p className="text-[11.5px] text-lobeans-muted">Foto tersimpan saat ini (pilih file baru untuk mengganti).</p>
          </div>
        )
      )}

      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  );
}
