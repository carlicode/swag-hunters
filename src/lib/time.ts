// Todo el evento ocurre en Las Vegas. En noviembre y diciembre rige la hora estándar del Pacífico (UTC-8),
// así que usamos un desfase fijo para convertir "día + hora de Las Vegas" a un instante UTC.
export const TZ = 'America/Los_Angeles';

export const EVENT_DAYS = [
  { iso: '2026-11-29', label: 'Dom 29 nov' },
  { iso: '2026-11-30', label: 'Lun 30 nov' },
  { iso: '2026-12-01', label: 'Mar 1 dic' },
  { iso: '2026-12-02', label: 'Mié 2 dic' },
  { iso: '2026-12-03', label: 'Jue 3 dic' },
  { iso: '2026-12-04', label: 'Vie 4 dic' },
] as const;

/** "2026-12-01" + "14:30" (hora de Las Vegas) -> ISO en UTC. */
export function vegasToIso(dayIso: string, hhmm: string): string {
  return new Date(`${dayIso}T${hhmm}:00-08:00`).toISOString();
}

const dayFmt = new Intl.DateTimeFormat('es', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

export const fmtTime = (iso: string) => timeFmt.format(new Date(iso));
export const fmtDay = (iso: string) => dayFmt.format(new Date(iso)).replace('.', '');
export const dayKey = (iso: string) => keyFmt.format(new Date(iso)); // YYYY-MM-DD en hora de Las Vegas

export function ago(iso: string, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

/** Texto de cuenta regresiva: "en 25 min", "en 2 h 10 min", "empezó hace 5 min". */
export function until(iso: string, now = Date.now()): { text: string; soon: boolean; past: boolean } {
  const diff = Math.round((new Date(iso).getTime() - now) / 60000);
  if (diff < -90) return { text: 'terminó', soon: false, past: true };
  if (diff < 0) return { text: `empezó ${ago(iso, now)}`, soon: false, past: true };
  if (diff < 60) return { text: `en ${diff} min`, soon: diff <= 30, past: false };
  const h = Math.floor(diff / 60);
  if (h < 24) return { text: `en ${h} h${diff % 60 ? ` ${diff % 60} min` : ''}`, soon: false, past: false };
  return { text: `en ${Math.floor(h / 24)} d`, soon: false, past: false };
}
