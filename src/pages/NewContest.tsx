import { useMemo, useState } from 'react';
import { CompanyField } from '../components/CompanyField';
import { IconBack } from '../components/icons';
import { Field, PhotoPicker } from '../components/ui';
import { api } from '../lib/api';
import { companyKey } from '../lib/company';
import { EVENT_DAYS, dayKey, fmtDay, fmtTime, vegasToIso } from '../lib/time';
import type { ContestKind } from '../lib/types';
import { back, go } from '../router';
import { useStore } from '../store';
import { KIND_LABEL } from './Contests';

const KINDS: { v: ContestKind; help: string }[] = [
  { v: 'VISIT', help: 'Vas al stand y participas en el momento.' },
  { v: 'TICKET', help: 'Pides un ticket o número y vuelves al sorteo.' },
  { v: 'TIMED', help: 'Tienes que estar a una hora exacta.' },
];

export function NewContest() {
  const { contests, refresh, toast } = useStore();
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [howTo, setHowTo] = useState('');
  const [reference, setReference] = useState('');
  const [kind, setKind] = useState<ContestKind>('TIMED');
  const [day, setDay] = useState<string>(EVENT_DAYS[1].iso);
  const [time, setTime] = useState('15:00');
  const [photo, setPhoto] = useState<Blob>();
  const [busy, setBusy] = useState(false);
  const [distinct, setDistinct] = useState(false);

  const startsAt = vegasToIso(day, time || '00:00');
  const similar = useMemo(() => {
    const key = companyKey(company);
    return key.length >= 2 ? contests.filter((c) => c.companyKey === key && dayKey(c.startsAt) === day) : [];
  }, [contests, company, day]);
  const ready = company.trim() && title.trim() && howTo.trim() && time;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    try {
      const c = await api.createContest({ company, title, howTo, kind, startsAt, reference, photo });
      await refresh();
      toast('Concurso agregado');
      go(`concurso/${c.id}`);
    } catch {
      toast('No se pudo guardar. Revisa tu conexión e intenta otra vez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" style={{ gap: 18 }} onSubmit={submit} noValidate>
      <div className="row between">
        <button type="button" className="btn ghost small" onClick={back}><IconBack style={{ width: 16 }} /> Cancelar</button>
        <span className="label">Nuevo concurso</span>
      </div>
      <h1 style={{ fontSize: 26 }}>Agregar un concurso</h1>

      <CompanyField value={company} onChange={(v) => { setCompany(v); setDistinct(false); }} known={contests} />

      <Field label="Qué se sortea o qué se gana" htmlFor="ct">
        <input id="ct" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Sorteo de power bank" />
      </Field>

      <div className="field">
        <span className="label">Cómo se participa</span>
        <div className="stack" style={{ gap: 8 }} role="radiogroup" aria-label="Tipo de concurso">
          {KINDS.map((k) => (
            <button type="button" key={k.v} role="radio" aria-checked={kind === k.v} className="panel" onClick={() => setKind(k.v)} style={{ textAlign: 'left', borderColor: kind === k.v ? 'var(--accent)' : undefined }}>
              <strong>{KIND_LABEL[k.v]}</strong>
              <span className="muted" style={{ display: 'block', fontSize: 13 }}>{k.help}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid two">
        <Field label="Día" htmlFor="d">
          <select id="d" className="select" value={day} onChange={(e) => setDay(e.target.value)}>
            {EVENT_DAYS.map((d) => <option key={d.iso} value={d.iso}>{d.label}</option>)}
          </select>
        </Field>
        <Field label="Hora de Las Vegas" htmlFor="tm" hint={`Se verá como ${fmtDay(startsAt)} ${fmtTime(startsAt)}.`}>
          <input id="tm" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      {similar.length > 0 && !distinct && (
        <div className="suggest">
          <p><strong>Ya hay un concurso de {similar[0].company} ese día.</strong> ¿Es el mismo?</p>
          {similar.map((c) => (
            <div className="item" key={c.id}>
              <div className="grow"><strong style={{ fontSize: 14 }}>{c.title}</strong><div className="mono muted" style={{ fontSize: 12 }}>{fmtTime(c.startsAt)}</div></div>
              <a className="btn small primary" href={`#/concurso/${c.id}`}>Es este</a>
            </div>
          ))}
          <button type="button" className="btn small" onClick={() => setDistinct(true)}>Es distinto</button>
        </div>
      )}

      <Field label="Qué hay que hacer" htmlFor="ch" hint="Pasos claros: dónde, a qué hora, qué llevar.">
        <textarea id="ch" className="textarea" value={howTo} onChange={(e) => setHowTo(e.target.value)} placeholder="Ej. Estar en el stand a la hora exacta. Si no estás, sortean otra vez." />
      </Field>
      <Field label="Referencia del stand" htmlFor="rf">
        <input id="rf" className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej. Stand 980, segundo piso" />
      </Field>
      <PhotoPicker value={photo} onChange={setPhoto} label="Foto del stand (opcional)" />

      <button className="btn primary block" disabled={!ready || busy}>{busy ? 'Guardando…' : 'Agregar concurso'}</button>
    </form>
  );
}
