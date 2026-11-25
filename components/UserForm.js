'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ActionForm, Field, Input, Select, SubmitButton } from './ActionForm.js';
import { buttonClass } from './styles.js';

export function UserForm({ action, suppliers = [], initial = {}, isEdit = false }) {
  const [role, setRole] = useState(initial.role || 'staff');

  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Nama lengkap" name="name" required>
          <Input name="name" defaultValue={initial.name} placeholder="Mis. Andi Pratama" required />
        </Field>
        <Field label="Email" name="email" required>
          <Input name="email" type="email" defaultValue={initial.email} placeholder="nama@lobeans.test" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Role" name="role" required>
          <Select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="manager">Manager Gudang</option>
            <option value="staff">Staff Gudang</option>
            <option value="supplier">Supplier</option>
          </Select>
        </Field>

        {!isEdit && role === 'supplier' ? (
          <Field label="Hubungkan ke profil Supplier" name="supplier_id" required hint="1 akun Supplier terhubung 1:1 ke 1 profil Supplier.">
            <Select name="supplier_id" defaultValue={suppliers[0]?.id || ''} required>
              {suppliers.length === 0 ? (
                <option value="">— Buat profil Supplier terlebih dahulu —</option>
              ) : (
                suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplier_code} — {s.company_name}
                  </option>
                ))
              )}
            </Select>
          </Field>
        ) : isEdit ? (
          <Field label="Status akun" name="is_active">
            <Select name="is_active" defaultValue={initial.is_active === false ? 'false' : 'true'}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
          </Field>
        ) : (
          <div />
        )}
      </div>

      <Field
        label={isEdit ? 'Kata sandi baru (opsional)' : 'Kata sandi'}
        name="password"
        required={!isEdit}
        hint={isEdit ? 'Kosongkan jika tidak ingin mengganti kata sandi.' : 'Minimal 8 karakter (disimpan dalam hash bcrypt).'}
      >
        <Input
          name="password"
          type="password"
          placeholder={isEdit ? 'Biarkan kosong jika tetap' : 'Minimal 8 karakter'}
          required={!isEdit}
        />
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-[#eeede6] pt-4">
        <Link href="/users" className={buttonClass('secondary', 'md')}>
          Batal
        </Link>
        <SubmitButton>{isEdit ? 'Simpan Perubahan' : 'Buat Akun'}</SubmitButton>
      </div>
    </ActionForm>
  );
}
