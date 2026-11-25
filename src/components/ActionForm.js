'use client';

import { createContext, useActionState, useContext, useEffect, useId, useRef, useState } from 'react';
import { Icon } from './icons.js';
import { buttonClass, inputCls } from './styles.js';

const Ctx = createContext({ errors: {}, values: {}, pending: false });
export const useFormCtx = () => useContext(Ctx);

/** Form yang terhubung ke Server Action (useActionState). */
export function ActionForm({ action, children, className = '' }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <Ctx.Provider value={{ errors: state.errors || {}, values: state.values || {}, pending }}>
      <form action={formAction} className={className}>
        {state.message && (
          <div
            role="alert"
            className={`mb-5 flex items-start gap-2 rounded-[10px] border px-4 py-3 text-[12px] ${
              state.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <Icon name={state.ok ? 'check' : 'alert'} className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}
        {children}
      </form>
    </Ctx.Provider>
  );
}

export function Field({ label, name, hint, required, children, className = '' }) {
  const { errors } = useFormCtx();
  const err = errors[name];
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="mb-1.5 block text-[12px] font-medium text-lobeans-ink-light">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {children}
      {err ? (
        <p className="mt-1 text-[11px] text-red-600">{err}</p>
      ) : (
        hint && <p className="mt-1 text-[11px] text-lobeans-muted">{hint}</p>
      )}
    </div>
  );
}

function useField(name, defaultValue, type) {
  const { values, errors } = useFormCtx();
  const dv = type === 'password' ? undefined : (values[name] ?? defaultValue);
  const invalid = errors[name] ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : '';
  return { dv, invalid };
}

export function Input({ name, defaultValue, type = 'text', className = '', ...rest }) {
  const { dv, invalid } = useField(name, defaultValue, type);
  return (
    <input
      key={`${name}:${dv ?? ''}`}
      id={name}
      name={name}
      type={type}
      defaultValue={dv}
      className={`${inputCls} ${invalid} ${className}`}
      {...rest}
    />
  );
}

export function Textarea({ name, defaultValue, className = '', rows = 3, ...rest }) {
  const { dv, invalid } = useField(name, defaultValue);
  return (
    <textarea
      key={`${name}:${dv ?? ''}`}
      id={name}
      name={name}
      rows={rows}
      defaultValue={dv}
      className={`${inputCls} h-auto py-2.5 ${invalid} ${className}`}
      {...rest}
    />
  );
}

export function Select({ name, defaultValue, children, className = '', ...rest }) {
  const { dv, invalid } = useField(name, defaultValue);
  return (
    <select
      key={`${name}:${dv ?? ''}`}
      id={name}
      name={name}
      defaultValue={dv}
      className={`${inputCls} ${invalid} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function SubmitButton({ children, variant = 'primary', size = 'md', pendingText = 'Menyimpan…', className = '' }) {
  const { pending } = useFormCtx();
  return (
    <button type="submit" disabled={pending} className={`${buttonClass(variant, size)} ${className}`}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Tombol aksi mandiri (Approve, Hapus, dll.) yang memanggil Server Action dengan field tersembunyi. */
export function ActionButton({
  action,
  values = {},
  children,
  variant = 'secondary',
  size = 'sm',
  confirm,
  blockedMessage,
  alertTitle = 'Peringatan',
  alertOnError = false,
  icon,
  className = '',
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [popupMessage, setPopupMessage] = useState('');
  const dialogRef = useRef(null);
  const titleId = useId();
  const usePopup = Boolean(blockedMessage || alertOnError);

  useEffect(() => {
    if (usePopup && state?.message && !state.ok) {
      setPopupMessage(state.message);
    }
  }, [state, usePopup]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (popupMessage && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [popupMessage]);

  // Fallback light-dismiss untuk browser yang belum mendukung atribut <dialog closedby="any">
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof HTMLDialogElement === 'undefined' || 'closedBy' in HTMLDialogElement.prototype) return;

    const isOutside = (e) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    let pressedOutside = false;
    const onPointerDown = (e) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e) => {
      if (pressedOutside && isOutside(e)) dialog.close();
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('pointerup', onPointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, [usePopup]);

  return (
    <>
      <form action={formAction} className="inline-flex flex-col items-start">
        {Object.entries(values).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v ?? ''} />
        ))}
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => {
            if (blockedMessage) {
              e.preventDefault();
              setPopupMessage(blockedMessage);
              return;
            }
            if (confirm && !window.confirm(confirm)) e.preventDefault();
          }}
          className={`${buttonClass(variant, size)} ${className}`}
        >
          {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
          {pending ? 'Memproses…' : children}
        </button>
        {!usePopup && state.message && !state.ok && (
          <span className="mt-1 max-w-[220px] text-[10px] text-red-600" role="alert">
            {state.message}
          </span>
        )}
      </form>

      {usePopup && (
        <dialog
          ref={dialogRef}
          closedby="any"
          aria-labelledby={titleId}
          onClose={() => {
            if (dialogRef.current) dialogRef.current.returnValue = '';
            setPopupMessage('');
          }}
          className="m-auto w-[min(92vw,440px)] rounded-[18px] border border-red-200 bg-white p-0 text-left shadow-2xl"
        >
          <div className="p-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <Icon name="alert" className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 id={titleId} className="text-[16px] font-bold leading-snug text-lobeans-ink">
                  {alertTitle}
                </h1>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#4b5b51]">{popupMessage}</p>
              </div>
            </div>
            <form method="dialog" className="mt-5 flex justify-end border-t border-[#eeede6] pt-4">
              <button type="submit" value="close" autoFocus className={buttonClass('dark', 'md')}>
                Mengerti
              </button>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
}
