import { tr as t, type Key } from '../i18n';
import { AlertControl } from '../components/AlertControl';
import { IconBack, IconFlag, IconPin } from '../components/icons';
import { Photo } from '../components/ui';
import { api } from '../lib/api';
import { ago, fmtDay, fmtTime, until } from '../lib/time';
import { back } from '../router';
import { useStore } from '../store';
import { kindLabel } from './Contests';



export function ContestDetail({ id }: { id: string }) {
  const { contests, toast } = useStore();
  const c = contests.find((x) => x.id === id);
  if (!c) return <p className="muted">{t('cd.notFound')}</p>;
  const u = until(c.startsAt);

  return (
    <>
      <div className="row between">
        <button className="btn ghost small" onClick={back}><IconBack style={{ width: 16 }} /> {t('common.back')}</button>
        <span className={`chip ${u.soon ? 'soon' : ''}`}>{u.text}</span>
      </div>

      {c.photoKey && <Photo k={c.photoKey} company={c.company} className="hero" alt={`${c.company}: ${c.title}`} />}

      <div className="stack" style={{ gap: 8 }}>
        <span className="label">{c.company}</span>
        <h1 style={{ fontSize: 28, lineHeight: 1.1 }}>{c.title}</h1>
        <p className="mono muted" style={{ fontSize: 12 }}>{t('cd.addedBy', { name: c.authorName, you: c.mine ? t('detail.you') : '', ago: ago(c.createdAt) })}</p>
      </div>

      <section className="panel">
        <dl className="kv" style={{ margin: 0 }}>
          <dt>{t('cd.when')}</dt><dd className="mono">{fmtDay(c.startsAt)} · {fmtTime(c.startsAt)} {t('cd.lasVegas')}{c.endsAt ? ` – ${fmtTime(c.endsAt)}` : ''}</dd>
          <dt>{t('cd.type')}</dt><dd>{kindLabel(c.kind)} <span className="muted">· {t(`cd.help.${c.kind}` as Key)}</span></dd>
          {c.reference && (<><dt>{t('cd.where')}</dt><dd className="row" style={{ gap: 6, alignItems: 'flex-start' }}><IconPin style={{ width: 16, marginTop: 3, flex: 'none' }} />{c.reference}</dd></>)}
        </dl>
      </section>

      <section className="panel stack" style={{ gap: 10 }}>
        <span className="label">{t('cd.whatToDo')}</span>
        <p className="howto">{c.howTo}</p>
      </section>

      <AlertControl contest={c} wide />

      {!c.mine && (
        <button className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => { void api.flag('CONTEST', id); toast(t('detail.reviewed')); }}>
          <IconFlag style={{ width: 14 }} /> {t('detail.report')}
        </button>
      )}
    </>
  );
}
