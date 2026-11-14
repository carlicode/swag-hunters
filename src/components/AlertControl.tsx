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
    if (fireAt < Date.now() - 30_000) return toast('Esa hora de aviso ya pasó. Elige menos minutos.');
    setBusy(true);
    try {
      await api.createAlert(contest, mins);
      await refresh();
      setOpen(false);
      toast(`Alerta lista: te avisamos ${mins} min antes`);
    } catch {
      toast('No se pudo crear la alerta. Intenta otra vez.');
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
      toast('Alerta cancelada');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {wide ? (
        <button className={`btn ${current ? '' : 'primary'} block`} onClick={() => setOpen(true)} disabled={started}>
          <IconBell style={{ width: 18 }} />
          {started ? 'Ya empezó' : current ? `Alerta ${current.minutesBefore} min antes · cambiar` : 'Avisarme por correo'}
        </button>
      ) : (
        <button className={`icon-btn ${current ? 'on' : ''}`} onClick={() => setOpen(true)} disabled={started} aria-label={current ? 'Editar alerta' : 'Crear alerta'} aria-pressed={!!current}>
          <IconBell />
        </button>
      )}
      {open && (
        <Sheet title="Alerta por correo" onClose={() => setOpen(false)}>
          <p className="muted" style={{ fontSize: 14 }}>
            {contest.company}: {contest.title} empieza a las <strong className="mono" style={{ color: 'var(--fg)' }}>{fmtTime(contest.startsAt)}</strong> (hora de Las Vegas).
            Te escribimos a <strong style={{ color: 'var(--fg)' }}>{user.email}</strong>.
          </p>
          <div className="pills" role="group" aria-label="Minutos antes">
            {OPTIONS.map((m) => (
              <button key={m} className="pill" aria-pressed={mins === m} onClick={() => setMins(m)}>{m} min antes</button>
            ))}
          </div>
          {api.demo && <p className="banner">En la demo no se envían correos de verdad.</p>}
          <button className="btn primary block" disabled={busy} onClick={() => void save()}>{current ? 'Actualizar alerta' : 'Crear alerta'}</button>
          {current && <button className="btn bad block" disabled={busy} onClick={() => void cancel()}>Cancelar alerta</button>}
        </Sheet>
      )}
    </>
  );
}
