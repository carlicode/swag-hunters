import { tr } from '../i18n';
import type { Swag, SwagReport } from './types';

export type SwagState = 'LIVE' | 'RECENT' | 'STALE' | 'MAYBE_GONE' | 'GONE';

export interface SwagStatus {
  state: SwagState;
  lastSeen: string; // última vez que alguien lo vio o lo subió
  confirmations: number;
  label: string;
}

const MIN = 60_000;

/**
 * Estado del swag a partir de lo que reportó la gente, como en Waze:
 * - "Se acabó" de 2 personas distintas después de la última confirmación = agotado.
 * - Con 1 sola persona queda "quizá agotado", para que un reporte solo no lo esconda.
 * - Si nadie lo confirma en horas, pasa de "visto ahora" a "sin confirmar".
 */
export function swagStatus(swag: Swag, reports: SwagReport[], now = Date.now()): SwagStatus {
  const mine = reports.filter((r) => r.swagId === swag.id);
  const confirms = mine.filter((r) => r.kind === 'STILL_THERE');
  const lastConfirm = confirms.reduce((t, r) => Math.max(t, +new Date(r.createdAt)), +new Date(swag.createdAt));
  const goneAfter = mine.filter((r) => r.kind === 'GONE' && +new Date(r.createdAt) > lastConfirm);
  const goneAuthors = new Set(goneAfter.map((r) => r.authorName));
  const lastSeen = new Date(lastConfirm).toISOString();
  const confirmations = confirms.length + 1; // +1 por quien lo subió

  if (goneAuthors.size >= 2) return { state: 'GONE', lastSeen, confirmations, label: tr('status.gone') };
  if (goneAuthors.size === 1) return { state: 'MAYBE_GONE', lastSeen, confirmations, label: tr('status.maybeGone') };
  const age = now - lastConfirm;
  if (age < 45 * MIN) return { state: 'LIVE', lastSeen, confirmations, label: tr('status.live') };
  if (age < 3 * 60 * MIN) return { state: 'RECENT', lastSeen, confirmations, label: tr('status.recent') };
  return { state: 'STALE', lastSeen, confirmations, label: tr('status.stale') };
}

/** Orden para descubrir: primero lo que está disponible y confirmado hace poco; al final lo agotado. */
export function discoverOrder(a: SwagStatus, b: SwagStatus): number {
  const rank = { LIVE: 0, RECENT: 1, STALE: 2, MAYBE_GONE: 3, GONE: 4 } as const;
  return rank[a.state] - rank[b.state] || +new Date(b.lastSeen) - +new Date(a.lastSeen);
}
