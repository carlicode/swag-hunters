import { tr as t } from '../i18n';
import { useMemo, useState } from 'react';
import { CompanyField } from '../components/CompanyField';
import { IconBack } from '../components/icons';
import { Field, Photo, PhotoPicker, StatusChip } from '../components/ui';
import { api } from '../lib/api';
import { companyKey } from '../lib/company';
import { back, go } from '../router';
import { useStore } from '../store';

export function NewSwag() {
  const { swags, statusOf, refresh, toast } = useStore();
  const [photo, setPhoto] = useState<Blob>();
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [howTo, setHowTo] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [distinct, setDistinct] = useState(false);

  // Si ya hay swag de esa empresa, preguntamos si es el mismo antes de crear uno nuevo.
  const sameCompany = useMemo(() => {
    const key = companyKey(company);
    return key.length >= 2 ? swags.filter((s) => s.companyKey === key) : [];
  }, [swags, company]);
  const mustChoose = sameCompany.length > 0 && !distinct;
  const ready = photo && company.trim() && title.trim() && howTo.trim() && reference.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    try {
      const swag = await api.createSwag({ company, title, howTo, reference, photo });
      await refresh();
      toast(t('ns.posted'));
      go(`swag/${swag.id}`);
    } catch {
      toast(t('ns.postFail'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" style={{ gap: 18 }} onSubmit={submit} noValidate>
      <div className="row between">
        <button type="button" className="btn ghost small" onClick={back}><IconBack style={{ width: 16 }} /> {t('common.cancel')}</button>
        <span className="label">{t('ns.new')}</span>
      </div>
      <h1 style={{ fontSize: 26 }}>{t('ns.title')}</h1>

      <PhotoPicker value={photo} onChange={setPhoto} label={t('ns.photoLabel')} hint={t('ns.photoHint')} />
      <CompanyField value={company} onChange={(v) => { setCompany(v); setDistinct(false); }} known={swags} />

      {mustChoose && (
        <div className="suggest" role="region" aria-label={t('ns.sameCompanyAria')}>
          <p><strong>{t('ns.alreadyTitle', { company: sameCompany[0].company })}</strong> {t('ns.alreadyText')}</p>
          {sameCompany.map((s) => {
            const st = statusOf(s);
            return (
              <div className="item" key={s.id}>
                <Photo k={s.photoKey} company={s.company} />
                <div className="grow">
                  <strong style={{ fontSize: 14 }}>{s.title}</strong>
                  <div><StatusChip state={st.state} label={st.label} /></div>
                </div>
                <a className="btn small primary" href={`#/swag/${s.id}`}>{t('ns.itsThis')}</a>
              </div>
            );
          })}
          <button type="button" className="btn small" onClick={() => setDistinct(true)}>{t('ns.different')}</button>
        </div>
      )}

      {!mustChoose && (
        <>
          <Field label={t('ns.whatIs')} htmlFor="t">
            <input id="t" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ns.whatPlaceholder')} />
          </Field>
          <Field label={t('ns.howTo')} htmlFor="h" hint={t('ns.howHint')}>
            <textarea id="h" className="textarea" value={howTo} onChange={(e) => setHowTo(e.target.value)} placeholder={t('ns.howPlaceholder')} />
          </Field>
          <Field label={t('ns.reference')} htmlFor="r" hint={t('ns.refHint')}>
            <input id="r" className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t('ns.refPlaceholder')} />
          </Field>
          <button className="btn primary block" disabled={!ready || busy}>{busy ? t('ns.publishing') : t('ns.publish')}</button>
          {!ready && <p className="mono muted" style={{ fontSize: 11.5, textAlign: 'center' }}>{t('ns.missing', { list: [!photo && t('ns.m.photo'), !company.trim() && t('ns.m.company'), !title.trim() && t('ns.m.what'), !howTo.trim() && t('ns.m.how'), !reference.trim() && t('ns.m.ref')].filter(Boolean).join(', ') })}</p>}
        </>
      )}
    </form>
  );
}
