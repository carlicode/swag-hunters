import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type Key } from './en';
import { es } from './es';

export type Lang = 'en' | 'es';
export type { Key };

const STORE = 'swag-hunters-lang';
const DICTS: Record<Lang, Record<Key, string>> = { en, es };

function initial(): Lang {
  try {
    const v = localStorage.getItem(STORE);
    if (v === 'en' || v === 'es') return v;
  } catch { /* sin almacenamiento */ }
  return 'en';
}

let current: Lang = initial();

type Vars = Record<string, string | number>;

function fmt(s: string, vars?: Vars): string {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : s;
}

/** Traducción fuera de React (helpers, store, errores). */
export function tr(key: Key, vars?: Vars): string {
  return fmt(DICTS[current][key] ?? en[key] ?? key, vars);
}

/** Plural simple: usa key_one / key_other según vars.n. */
export function trn(base: string, n: number, vars?: Vars): string {
  return tr((base + (n === 1 ? '_one' : '_other')) as Key, { n, ...vars });
}

export const locale = () => (current === 'es' ? 'es' : 'en-US');
export const getLang = () => current;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Vars) => string;
  tn: (base: string, n: number, vars?: Vars) => string;
}

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  const setLang = useCallback((l: Lang) => {
    current = l;
    try { localStorage.setItem(STORE, l); } catch { /* ignore */ }
    setLangState(l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: tr, tn: trn }), [lang, setLang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nCtx);
  if (!c) throw new Error('useI18n fuera de I18nProvider');
  return c;
}
