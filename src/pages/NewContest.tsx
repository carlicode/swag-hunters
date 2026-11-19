import { tr as t, type Key } from '../i18n';
import { useMemo, useState } from 'react';
import { CompanyField } from '../components/CompanyField';
import { IconBack } from '../components/icons';
import { Field, PhotoPicker } from '../components/ui';
import { api } from '../lib/api';
import { companyKey } from '../lib/company';
import { EVENT_DAYS, dayKey, dayLabel, fmtDay, fmtTime, vegasToIso } from '../lib/time';
import type { ContestKind } from '../lib/types';
import { back, go } from '../router';
import { useStore } from '../store';
import { kindLabel } from './Contests';

const KINDS: ContestKind[] = ['VISIT', 'TICKET', 'TIMED'];

export function NewContest() {
  const { contests, refresh, toast } = useStore();
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [howTo, setHowTo] = useState('');
  const [reference, setReference] = useState('');
  const [kind, setKind] = useState<ContestKind>('TIMED');
  const [day, setDay] = useState<string>(EVENT_DAYS[1]);
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
      toast(t('nc.added'));
      go(`concurso/${c.id}`);
    } catch {
      toast(t('nc.saveFail'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" style={{ gap: 18 }} onSubmit={submit} noValidate>
      <div className="row between">
        <button type="button" className="btn ghost small" onClick={back}><IconBack style={{ width: 16 }} /> {t('common.cancel')}</button>
        <span className="label">{t('nc.new')}</span>
      </div>
      <h1 style={{ fontSize: 26 }}>{t('nc.title')}</h1>

      <CompanyField value={company} onChange={(v) => { setCompany(v); setDistinct(false); }} known={contests} />

      <Field label={t('nc.prizeLabel')} htmlFor="ct">
        <input id="ct" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('nc.prizePlaceholder')} />
      </Field>

      <div className="field">
        <span className="label">{t('nc.howToJoin')}</span>
        <div className="stack" style={{ gap: 8 }} role="radiogroup" aria-label={t('nc.kindAria')}>
          {KINDS.map((k) => (
            <button type="button" key={k} role="radio" aria-checked={kind === k} className="panel" onClick={() => setKind(k)} style={{ textAlign: 'left', borderColor: kind === k ? 'var(--accent)' : undefined }}>
              <strong>{kindLabel(k)}</strong>
              <span className="muted" style={{ display: 'block', fontSize: 13 }}>{t(`nc.help.${k}` as Key)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid two">
        <Field label={t('nc.day')} htmlFor="d">
          <select id="d" className="select" value={day} onChange={(e) => setDay(e.target.value)}>
            {EVENT_DAYS.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
          </select>
        </Field>
        <Field label={t('nc.vegasTime')} htmlFor="tm" hint={t('nc.willShowAs', { when: `${fmtDay(startsAt)} ${fmtTime(startsAt)}` })}>
          <input id="tm" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      {similar.length > 0 && !distinct && (
        <div className="suggest">
          <p><strong>{t('nc.similarTitle', { company: similar[0].company })}</strong> {t('nc.same')}</p>
          {similar.map((c) => (
            <div className="item" key={c.id}>
              <div className="grow"><strong style={{ fontSize: 14 }}>{c.title}</strong><div className="mono muted" style={{ fontSize: 12 }}>{fmtTime(c.startsAt)}</div></div>
              <a className="btn small primary" href={`#/concurso/${c.id}`}>{t('ns.itsThis')}</a>
            </div>
          ))}
          <button type="button" className="btn small" onClick={() => setDistinct(true)}>{t('nc.different')}</button>
        </div>
      )}

      <Field label={t('nc.whatToDo')} htmlFor="ch" hint={t('nc.whatHint')}>
        <textarea id="ch" className="textarea" value={howTo} onChange={(e) => setHowTo(e.target.value)} placeholder={t('nc.whatPlaceholder')} />
      </Field>
      <Field label={t('nc.boothRef')} htmlFor="rf">
        <input id="rf" className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t('nc.boothPlaceholder')} />
      </Field>
      <PhotoPicker value={photo} onChange={setPhoto} label={t('nc.photo')} />

      <button className="btn primary block" disabled={!ready || busy}>{busy ? t('nc.saving') : t('nc.add')}</button>
    </form>
  );
}
