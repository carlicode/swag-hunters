import { locale, tr } from '../i18n';

// Todo el evento ocurre en Las Vegas. En noviembre y diciembre rige la hora estándar del Pacífico (UTC-8),
// así que usamos un desfase fijo para convertir "día + hora de Las Vegas" a un instante UTC.
export const TZ = 'America/Los_Angeles';

export const EVENT_DAYS = ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04'] as const;

/** "2026-12-01" + "14:30" (hora de Las Vegas) -> ISO en UTC. */
export function vegasToIso(dayIso: string, hhmm: string): string {
  return new Date(`${dayIso}T${hhmm}:00-08:00`).toISOString();
}

// Los formateadores dependen del idioma, así que se crean y se guardan por locale.
const cache = new Map<string, Intl.DateTimeFormat>();
function dayFmt() {
  const l = locale();
  let f = cache.get(l);
  if (!f) {
    f = new Intl.DateTimeFormat(l, { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
    cache.set(l, f);
  }
  return f;
}
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

export const fmtTime = (iso: string) => timeFmt.format(new Date(iso));
export const fmtDay = (iso: string) => dayFmt().format(new Date(iso)).replace(/\./g, '');
/** Etiqueta de un día del evento ("Tue, Dec 1" / "mar, 1 dic"). */
export const dayLabel = (dayIso: string) => fmtDay(vegasToIso(dayIso, '12:00'));
export const dayKey = (iso: string) => keyFmt.format(new Date(iso)); // YYYY-MM-DD en hora de Las Vegas

export function ago(iso: string, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (min < 1) return tr('time.now');
  if (min < 60) return tr('time.minAgo', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return tr('time.hAgo', { n: h });
  return tr('time.dAgo', { n: Math.floor(h / 24) });
}

/** Texto de cuenta regresiva: "in 25 min", "in 2 h 10 min", "started 5 min ago". */
export function until(iso: string, now = Date.now()): { text: string; soon: boolean; past: boolean } {
  const diff = Math.round((new Date(iso).getTime() - now) / 60000);
  if (diff < -90) return { text: tr('time.ended'), soon: false, past: true };
  if (diff < 0) return { text: tr('time.startedAgo', { ago: ago(iso, now) }), soon: false, past: true };
  if (diff < 60) return { text: tr('time.inMin', { n: diff }), soon: diff <= 30, past: false };
  const h = Math.floor(diff / 60);
  if (h < 24) {
    const m = diff % 60;
    return { text: m ? tr('time.inHM', { h, m }) : tr('time.inH', { h }), soon: false, past: false };
  }
  return { text: tr('time.inD', { n: Math.floor(h / 24) }), soon: false, past: false };
}
