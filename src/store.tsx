import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { tr, useI18n } from './i18n';
import { api } from './lib/api';
import { swagStatus, type SwagStatus } from './lib/status';
import type { AlertItem, Contest, Swag, SwagReport, User } from './lib/types';

interface Store {
  user: User;
  loading: boolean;
  swags: Swag[];
  reports: SwagReport[];
  contests: Contest[];
  alerts: AlertItem[];
  saved: Set<string>;
  statusOf: (swag: Swag) => SwagStatus;
  refresh: () => Promise<void>;
  toggleSaved: (swagId: string) => Promise<void>;
  toast: (msg: string) => void;
  toastMsg: string | null;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fuera del proveedor');
  return s;
};

export function StoreProvider({ user, children }: { user: User; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [swags, setSwags] = useState<Swag[]>([]);
  const [reports, setReports] = useState<SwagReport[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const timer = useRef<number>(0);
  const { lang } = useI18n(); // las etiquetas de estado cambian con el idioma

  const refresh = useCallback(async () => {
    try {
      const [{ swags, reports }, contests, alerts, saved] = await Promise.all([
        api.listSwags(),
        api.listContests(),
        api.listAlerts(),
        api.listSaved(),
      ]);
      setSwags(swags);
      setReports(reports);
      setContests(contests);
      setAlerts(alerts);
      setSaved(new Set(saved));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Los estados cambian con el tiempo ("visto hace 12 min"): refrescamos datos cada minuto y al volver a la app.
    const id = window.setInterval(() => {
      setNow(Date.now());
      void refresh();
    }, 60_000);
    const onVisible = () => document.visibilityState === 'visible' && void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const toggleSaved = useCallback(
    async (swagId: string) => {
      const next = !saved.has(swagId);
      setSaved((s) => {
        const c = new Set(s);
        if (next) c.add(swagId);
        else c.delete(swagId);
        return c;
      });
      try {
        await api.setSaved(swagId, next);
      } catch {
        toast(tr('store.saveFail'));
        void refresh();
      }
    },
    [saved, refresh, toast],
  );

  const value = useMemo<Store>(
    () => ({
      user,
      loading,
      swags,
      reports,
      contests,
      alerts,
      saved,
      statusOf: (swag) => swagStatus(swag, reports, now),
      refresh,
      toggleSaved,
      toast,
      toastMsg,
    }),
    [user, loading, swags, reports, contests, alerts, saved, now, lang, refresh, toggleSaved, toast, toastMsg],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
