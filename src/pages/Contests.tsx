import { tr as t, type Key } from '../i18n';
import { useMemo, useState } from 'react';
import { AlertControl } from '../components/AlertControl';
import { IconPlus } from '../components/icons';
import { Empty } from '../components/ui';
import { dayKey, fmtDay, fmtTime, until } from '../lib/time';
import type { ContestKind } from '../lib/types';
import { go } from '../router';
import { useStore } from '../store';

export const kindLabel = (k: ContestKind) => t(`c.kind.${k}` as Key);

export function Contests() {
  const { contests, alerts, loading } = useStore();
  const [showPast, setShowPast] = useState(false);
  const now = Date.now();

  const sorted = useMemo(() => [...contests].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)), [contests]);
  const isPast = (iso: string) => now - +new Date(iso) > 90 * 60_000;
  const upcoming = sorted.filter((c) => !isPast(c.startsAt));
  const past = sorted.filter((c) => isPast(c.startsAt));
  const list = showPast ? sorted : upcoming;

  const days = useMemo(() => {
    const m = new Map<string, typeof list>();
    for (const c of list) {
      const k = dayKey(c.startsAt);
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return [...m.entries()];
  }, [list]);

  if (loading) return <div className="spin" role="status" aria-label={t('common.loading')} />;

  return (
    <>
      <div className="row between wrap">
        <div>
          <h1 style={{ fontSize: 24 }}>{t('c.title')}</h1>
          <p className="mono muted" style={{ fontSize: 12 }}>{t('c.stats', { upcoming: upcoming.length, alerts: alerts.filter((a) => a.sentFlag === 'N').length })}</p>
        </div>
        <button className="btn primary small" onClick={() => go('nuevo-concurso')}><IconPlus style={{ width: 16 }} /> {t('c.add')}</button>
      </div>

      {days.length === 0 && (
        <Empty title={t('c.emptyTitle')} text={t('c.emptyText')}>
          <button className="btn primary" onClick={() => go('nuevo-concurso')}>{t('c.addContest')}</button>
        </Empty>
      )}

      {days.map(([key, items]) => (
        <section className="day" key={key}>
          <span className="label">{fmtDay(items[0].startsAt)}</span>
          {items.map((c) => {
            const u = until(c.startsAt, now);
            const alert = alerts.find((a) => a.contestId === c.id && a.sentFlag === 'N');
            return (
              <div key={c.id} className={`crow ${u.past ? 'past' : ''}`}>
                <div className="time">{fmtTime(c.startsAt).replace(' ', '')}<small>PT</small></div>
                <a href={`#/concurso/${c.id}`}>
                  <span className="label">{c.company}</span>
                  <h3>{c.title}</h3>
                  <div className="sub">
                    <span className="chip">{kindLabel(c.kind)}</span>
                    <span className={`chip ${u.soon ? 'soon' : ''}`}>{u.text}</span>
                    {alert && <span className="mono">{t('c.alertBadge', { n: alert.minutesBefore })}</span>}
                  </div>
                </a>
                <AlertControl contest={c} />
              </div>
            );
          })}
        </section>
      ))}

      {past.length > 0 && (
        <button className="btn ghost small" style={{ alignSelf: 'center' }} onClick={() => setShowPast((v) => !v)}>
          {showPast ? t('c.hidePast') : t('c.showPast', { n: past.length })}
        </button>
      )}
    </>
  );
}
