import { AlertControl } from '../components/AlertControl';
import { IconBack, IconFlag, IconPin } from '../components/icons';
import { Photo } from '../components/ui';
import { api } from '../lib/api';
import { ago, fmtDay, fmtTime, until } from '../lib/time';
import { back } from '../router';
import { useStore } from '../store';
import { KIND_LABEL } from './Contests';

const KIND_HELP = {
  VISIT: 'Tienes que ir al stand a participar.',
  TICKET: 'Pide un ticket o número y vuelve a la hora del sorteo.',
  TIMED: 'Hay que estar presente a la hora exacta.',
} as const;

export function ContestDetail({ id }: { id: string }) {
  const { contests, toast } = useStore();
  const c = contests.find((x) => x.id === id);
  if (!c) return <p className="muted">Este concurso no existe o todavía se está cargando.</p>;
  const u = until(c.startsAt);

  return (
    <>
      <div className="row between">
        <button className="btn ghost small" onClick={back}><IconBack style={{ width: 16 }} /> Volver</button>
        <span className={`chip ${u.soon ? 'soon' : ''}`}>{u.text}</span>
      </div>

      {c.photoKey && <Photo k={c.photoKey} company={c.company} className="hero" alt={`${c.company}: ${c.title}`} />}

      <div className="stack" style={{ gap: 8 }}>
        <span className="label">{c.company}</span>
        <h1 style={{ fontSize: 28, lineHeight: 1.1 }}>{c.title}</h1>
        <p className="mono muted" style={{ fontSize: 12 }}>Agregado por {c.authorName}{c.mine ? ' (tú)' : ''} · {ago(c.createdAt)}</p>
      </div>

      <section className="panel">
        <dl className="kv" style={{ margin: 0 }}>
          <dt>Cuándo</dt><dd className="mono">{fmtDay(c.startsAt)} · {fmtTime(c.startsAt)} (Las Vegas){c.endsAt ? ` – ${fmtTime(c.endsAt)}` : ''}</dd>
          <dt>Tipo</dt><dd>{KIND_LABEL[c.kind]} <span className="muted">· {KIND_HELP[c.kind]}</span></dd>
          {c.reference && (<><dt>Dónde</dt><dd className="row" style={{ gap: 6, alignItems: 'flex-start' }}><IconPin style={{ width: 16, marginTop: 3, flex: 'none' }} />{c.reference}</dd></>)}
        </dl>
      </section>

      <section className="panel stack" style={{ gap: 10 }}>
        <span className="label">Qué hay que hacer</span>
        <p className="howto">{c.howTo}</p>
      </section>

      <AlertControl contest={c} wide />

      {!c.mine && (
        <button className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => { void api.flag('CONTEST', id); toast('Gracias, lo revisaremos'); }}>
          <IconFlag style={{ width: 14 }} /> Reportar contenido
        </button>
      )}
    </>
  );
}
