import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { placeholderArt } from '../lib/art';
import { compressImage } from '../lib/image';
import type { SwagState } from '../lib/status';
import { IconCamera } from './icons';

/** Foto de S3 (o de la demo). Si no hay foto, muestra el arte de reemplazo de la empresa. */
export function Photo({ k, company, className = '', alt = '' }: { k?: string; company: string; className?: string; alt?: string }) {
  const [src, setSrc] = useState<string>(() => (k ? '' : placeholderArt(company)));
  useEffect(() => {
    let alive = true;
    if (!k) {
      setSrc(placeholderArt(company));
      return;
    }
    api
      .photoUrl(k)
      .then((u) => alive && setSrc(u))
      .catch(() => alive && setSrc(placeholderArt(company)));
    return () => {
      alive = false;
    };
  }, [k, company]);
  return (
    <div className={`photo ${className}`}>
      {src && <img src={src} alt={alt} loading="lazy" draggable={false} onError={() => setSrc(placeholderArt(company))} />}
    </div>
  );
}

const CHIP: Record<SwagState, string> = { LIVE: 'live', RECENT: 'recent', STALE: 'stale', MAYBE_GONE: 'maybe', GONE: 'gone' };
export function StatusChip({ state, label }: { state: SwagState; label: string }) {
  return (
    <span className={`chip ${CHIP[state]}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** Zona para tomar o elegir una foto. Devuelve la foto ya reducida. */
export function PhotoPicker({
  value,
  onChange,
  label = 'Toma una foto',
  hint,
}: {
  value?: Blob;
  onChange: (b?: Blob) => void;
  label?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!value) return setPreview(undefined);
    const u = URL.createObjectURL(value);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [value]);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    try {
      onChange(await compressImage(f));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <input ref={input} type="file" accept="image/*" capture="environment" onChange={pick} className="sr" aria-label={label} />
      <div className="drop" role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}>
        {preview && <img src={preview} alt="Vista previa" />}
        {!preview && (
          <>
            <IconCamera />
            <strong>{busy ? 'Procesando…' : label}</strong>
            {hint && <span className="muted" style={{ fontSize: 13 }}>{hint}</span>}
          </>
        )}
        {preview && <span className="btn small retake" style={{ background: 'var(--bg)' }}>Cambiar foto</span>}
      </div>
    </>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2 style={{ fontSize: 18 }}>{title}</h2>
          <button className="btn ghost small" onClick={onClose}>Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <svg className="glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
      <h2 style={{ fontSize: 18 }}>{title}</h2>
      {text && <p className="muted" style={{ maxWidth: 300 }}>{text}</p>}
      {children}
    </div>
  );
}
