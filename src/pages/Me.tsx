import { getLang, tr as t } from '../i18n';
import { useState } from 'react';
import { AlertControl } from '../components/AlertControl';
import { Seg } from '../components/Seg';
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
        <button className="btn small" onClick={() => void api.signOut()}>{t('me.signOut')}</button>
      </div>

      <Seg
        label={t('me.section')}
        value={tab}
        onChange={setTab}
        className="left"
        options={[
          { value: 'saved', label: t('me.saved', { n: savedSwags.length }) },
          { value: 'alerts', label: t('me.alerts', { n: pending.length }) },
          { value: 'mine', label: t('me.mine') },
        ]}
      />

      {tab === 'saved' && (
        savedSwags.length ? (
          <div className="grid two">{savedSwags.map((s) => <SwagRow key={s.id} swag={s} status={statusOf(s)} />)}</div>
        ) : (
          <Empty title={t('me.emptySavedTitle')} text={t('me.emptySavedText')}>
            <button className="btn primary" onClick={() => go('descubrir')}>{t('me.goDiscover')}</button>
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
                    <div className="sub"><span className="mono">{t('me.alertEntry', { n: a.minutesBefore })}</span></div>
                  </a>
                  {c && <AlertControl contest={c} />}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty title={t('me.noAlertsTitle')} text={t('me.noAlertsText')}>
            <button className="btn primary" onClick={() => go('concursos')}>{t('me.seeContests')}</button>
          </Empty>
        )
      )}

      {tab === 'mine' && (
        mineSwags.length + mineContests.length ? (
          <div className="stack">
            {mineSwags.length > 0 && <span className="label">{t('me.swagsCount', { n: mineSwags.length })}</span>}
            <div className="grid two">{mineSwags.map((s) => <SwagRow key={s.id} swag={s} status={statusOf(s)} />)}</div>
            {mineContests.length > 0 && <span className="label">{t('me.contestsCount', { n: mineContests.length })}</span>}
            {mineContests.map((c) => (
              <a className="lcard" key={c.id} href={`#/concurso/${c.id}`}>
                <div className="meta grow"><span className="label">{c.company}</span><h3>{c.title}</h3><div className="sub mono">{fmtDay(c.startsAt)} · {fmtTime(c.startsAt)}</div></div>
              </a>
            ))}
          </div>
        ) : (
          <Empty title={t('me.nothingTitle')} text={t('me.nothingText')}>
            <button className="btn primary" onClick={() => go('nuevo')}>{t('disc.uploadSwag')}</button>
          </Empty>
        )
      )}

      <hr className="rule" />
      <p className="mono muted" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
        {t('me.footer')}
        {' '}<a href="#/privacidad">{t('me.privacy')}</a> · <a href="#/terminos">{t('me.terms')}</a>
      </p>
      {api.demo && (
        <button className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => { const l = getLang(); localStorage.clear(); localStorage.setItem('swag-hunters-lang', l); location.reload(); }}>
          {t('me.resetDemo')}
        </button>
      )}
    </>
  );
}
