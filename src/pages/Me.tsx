import { useState } from 'react';
import { AlertControl } from '../components/AlertControl';
import { SwagRow } from '../components/SwagCard';
import { Empty } from '../components/ui';
import { api } from '../lib/api';
import { fmtDay, fmtTime } from '../lib/time';
import { go } from '../router';
import { useStore } from '../store';

type Tab = 'saved' | 'alerts' | 'mine';

export function Me() {
  const { user, swags, contests, alerts, saved, statusOf } = useStore();
  const [tab, setTab] = useState<Tab>('saved');
  const savedSwags = swags.filter((s) => saved.has(s.id));
  const mineSwags = swags.filter((s) => s.mine);
  const mineContests = contests.filter((c) => c.mine);
  const pending = alerts.filter((a) => a.sentFlag === 'N').sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  return (
    <>
      <div className="row between">
        <div className="row">
          <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <h1 style={{ fontSize: 22 }}>{user.name}</h1>
            <p className="mono muted" style={{ fontSize: 12 }}>{user.email}{user.country ? ` · ${user.country}` : ''}</p>
          </div>
        </div>
        <button className="btn small" onClick={() => void api.signOut()}>Salir</button>
      </div>

      <div className="seg" role="tablist" style={{ alignSelf: 'flex-start' }}>
        <button role="tab" aria-pressed={tab === 'saved'} onClick={() => setTab('saved')}>Guardados {savedSwags.length}</button>
        <button role="tab" aria-pressed={tab === 'alerts'} onClick={() => setTab('alerts')}>Alertas {pending.length}</button>
        <button role="tab" aria-pressed={tab === 'mine'} onClick={() => setTab('mine')}>Mis aportes</button>
      </div>

      {tab === 'saved' && (
        savedSwags.length ? (
          <div className="grid two">{savedSwags.map((s) => <SwagRow key={s.id} swag={s} status={statusOf(s)} />)}</div>
        ) : (
          <Empty title="Aún no guardas nada" text="Desliza a la derecha en Descubrir para guardar los swags que quieres conseguir.">
            <button className="btn primary" onClick={() => go('descubrir')}>Ir a descubrir</button>
          </Empty>
        )
      )}

      {tab === 'alerts' && (
        pending.length ? (
          <div className="stack" style={{ gap: 10 }}>
            {pending.map((a) => {
              const c = contests.find((x) => x.id === a.contestId);
              return (
                <div className="crow" key={a.id} style={{ gridTemplateColumns: '64px 1fr auto' }}>
                  <div className="time">{fmtTime(a.startsAt).replace(' ', '')}<small>{fmtDay(a.startsAt)}</small></div>
                  <a href={`#/concurso/${a.contestId}`}>
                    <span className="label">{a.company}</span>
                    <h3>{a.title}</h3>
                    <div className="sub"><span className="mono">aviso {a.minutesBefore} min antes</span></div>
                  </a>
                  {c && <AlertControl contest={c} />}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty title="No tienes alertas" text="En Concursos toca la campana para recibir un correo unos minutos antes.">
            <button className="btn primary" onClick={() => go('concursos')}>Ver concursos</button>
          </Empty>
        )
      )}

      {tab === 'mine' && (
        mineSwags.length + mineContests.length ? (
          <div className="stack">
            {mineSwags.length > 0 && <span className="label">Swags · {mineSwags.length}</span>}
            <div className="grid two">{mineSwags.map((s) => <SwagRow key={s.id} swag={s} status={statusOf(s)} />)}</div>
            {mineContests.length > 0 && <span className="label">Concursos · {mineContests.length}</span>}
            {mineContests.map((c) => (
              <a className="lcard" key={c.id} href={`#/concurso/${c.id}`}>
                <div className="meta grow"><span className="label">{c.company}</span><h3>{c.title}</h3><div className="sub mono">{fmtDay(c.startsAt)} · {fmtTime(c.startsAt)}</div></div>
              </a>
            ))}
          </div>
        ) : (
          <Empty title="Todavía no subes nada" text="Cuando encuentres swag o un concurso, súbelo y ayuda al resto.">
            <button className="btn primary" onClick={() => go('nuevo')}>Subir swag</button>
          </Empty>
        )
      )}

      <hr className="rule" />
      <p className="mono muted" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
        SWAG HUNTERS es una app no oficial hecha por la comunidad. No tiene relación con AWS ni con re:Invent. Las horas son de Las Vegas (PT).
        {' '}<a href="#/privacidad">Privacidad</a> · <a href="#/terminos">Términos</a>
      </p>
      {api.demo && (
        <button className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => { localStorage.clear(); location.reload(); }}>
          Reiniciar la demo
        </button>
      )}
    </>
  );
}
