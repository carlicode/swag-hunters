import { tr as t } from '../i18n';
import { useState } from 'react';
import { api } from '../lib/api';
import { fmtTime } from '../lib/time';
import type { Contest } from '../lib/types';
import { useStore } from '../store';
import { IconBell } from './icons';
import { Sheet } from './ui';

const OPTIONS = [5, 10, 15, 30, 60];

/** Campana de alerta. Con una alerta activa se ve llena; al tocarla se puede cambiar o cancelar. */
export function AlertControl({ contest, wide = false }: { contest: Contest; wide?: boolean }) {
  const { alerts, refresh, toast, user } = useStore();
  const current = alerts.find((a) => a.contestId === contest.id && a.sentFlag === 'N');
  const [open, setOpen] = useState(false);
  const [mins, setMins] = useState(current?.minutesBefore ?? 15);
  const [busy, setBusy] = useState(false);
  const started = Date.now() >= +new Date(contest.startsAt);

  async function save() {
    const fireAt = +new Date(contest.startsAt) - mins * 60_000;
    if (fireAt < Date.now() - 30_000) return toast(t('al.tooLate'));
    setBusy(true);
    try {
      await api.createAlert(contest, mins);
      await refresh();
      setOpen(false);
      toast(t('al.ready', { n: mins }));
    } catch {
      toast(t('al.fail'));
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    if (!current) return;
    setBusy(true);
    try {
      await api.deleteAlert(current.id);
      await refresh();
      setOpen(false);
      toast(t('al.cancelled'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {wide ? (
        <button className={`btn ${current ? '' : 'primary'} block`} onClick={() => setOpen(true)} disabled={started}>
          <IconBell style={{ width: 18 }} />
          {started ? t('al.started') : current ? t('al.change', { n: current.minutesBefore }) : t('al.emailMe')}
        </button>
      ) : (
        <button className={`icon-btn ${current ? 'on' : ''}`} onClick={() => setOpen(true)} disabled={started} aria-label={current ? t('al.editAria') : t('al.createAria')} aria-pressed={!!current}>
          <IconBell />
        </button>
      )}
      {open && (
        <Sheet title={t('al.sheetTitle')} onClose={() => setOpen(false)}>
          <p className="muted" style={{ fontSize: 14 }}>
            {t('al.sheetText', { company: contest.company, title: contest.title, time: fmtTime(contest.startsAt), email: user.email ?? '' })}
          </p>
          <div className="pills" role="group" aria-label={t('al.minutesAria')}>
            {OPTIONS.map((m) => (
              <button key={m} className="pill" aria-pressed={mins === m} onClick={() => setMins(m)}>{t('al.minBefore', { n: m })}</button>
            ))}
          </div>
          {api.demo && <p className="banner">{t('al.demoBanner')}</p>}
          <button className="btn primary block" disabled={busy} onClick={() => void save()}>{current ? t('al.update') : t('al.create')}</button>
          {current && <button className="btn bad block" disabled={busy} onClick={() => void cancel()}>{t('al.cancel')}</button>}
        </Sheet>
      )}
    </>
  );
}
