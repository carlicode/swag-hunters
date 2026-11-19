import { useEffect, useRef, useState, type ReactNode } from 'react';
import { tr as t } from '../i18n';
import { IconBell, IconCamera, IconCheck, IconHeart, IconX } from './icons';

const SEEN = 'swag-hunters-tour-v1';
export const REPO = 'https://github.com/carlicode/swag-hunters';
export const AUTHOR_EMAIL = 'carli.f.roman@gmail.com';

export const tourSeen = () => {
  try {
    return localStorage.getItem(SEEN) === '1';
  } catch {
    return true;
  }
};
/** Abre el tutorial desde cualquier lugar (por ejemplo, desde Yo). */
export const openTour = () => window.dispatchEvent(new Event('swag:tour'));

/* Mini ilustraciones de cada paso, hechas con CSS para que pesen poco y sigan el tema. */
const ArtSwipe = () => (
  <div className="tour-art swipe">
    <div className="tour-card back" />
    <div className="tour-card">
      <span className="label">Nimbus Labs</span>
      <strong>{t('lp.c1.title')}</strong>
      <span className="chip live"><span className="dot" />{t('status.live')}</span>
    </div>
    <span className="tour-side no"><IconX /></span>
    <span className="tour-side yes"><IconHeart /></span>
  </div>
);
const ArtConfirm = () => (
  <div className="tour-art stack">
    <span className="chip maybe"><span className="dot" />{t('status.maybeGone')}</span>
    <div className="row" style={{ gap: 8 }}>
      <span className="btn live small tour-pulse"><IconCheck style={{ width: 16 }} /> {t('detail.btnStillThere')}</span>
      <span className="btn bad small"><IconX style={{ width: 16 }} /> {t('detail.btnGone')}</span>
    </div>
    <span className="chip live"><span className="dot" />{t('status.live')}</span>
  </div>
);
const ArtUpload = () => (
  <div className="tour-art stack">
    <div className="tour-drop"><IconCamera /><span>{t('ui.takePhoto')}</span></div>
    <div className="tour-suggest">
      <strong>{t('ns.alreadyTitle', { company: 'Nimbus Labs' })}</strong>
      <span className="row" style={{ gap: 6 }}><span className="btn small primary">{t('ns.itsThis')}</span><span className="btn small">{t('ns.different')}</span></span>
    </div>
  </div>
);
const ArtAlert = () => (
  <div className="tour-art stack">
    <div className="tour-crow">
      <span className="mono tour-time">3:00PM<small>PT</small></span>
      <span className="grow"><span className="label">Helix Data</span><strong>{t('tour.sampleContest')}</strong></span>
      <span className="icon-btn on tour-ring"><IconBell /></span>
    </div>
    <span className="tour-mail">✉ {t('tour.sampleMail')}</span>
  </div>
);
const ArtCredits = () => (
  <div className="tour-art stack">
    <span className="wordmark" style={{ fontSize: 15 }}><i />SWAG<span>/</span>HUNTERS</span>
    <span className="tour-code mono">git checkout -b my-idea<br />git push · open a PR ✓</span>
  </div>
);

interface Slide { art: ReactNode; title: string; text: ReactNode }

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const start = useRef<number | null>(null);

  const slides: Slide[] = [
    { art: <ArtSwipe />, title: t('tour.s1.title'), text: t('tour.s1.text') },
    { art: <ArtConfirm />, title: t('tour.s2.title'), text: t('tour.s2.text') },
    { art: <ArtUpload />, title: t('tour.s3.title'), text: t('tour.s3.text') },
    { art: <ArtAlert />, title: t('tour.s4.title'), text: t('tour.s4.text') },
    {
      art: <ArtCredits />,
      title: t('tour.s5.title'),
      text: (
        <>
          {t('tour.s5.text')}{' '}
          <a href={REPO} target="_blank" rel="noreferrer">{t('credits.repo')}</a>
          {' · '}
          <a href={`mailto:${AUTHOR_EMAIL}`}>{AUTHOR_EMAIL}</a>
        </>
      ),
    },
  ];
  const last = i === slides.length - 1;

  const close = () => {
    try {
      localStorage.setItem(SEEN, '1');
    } catch {
      /* sin almacenamiento */
    }
    onClose();
  };
  const go = (n: number) => setI(Math.max(0, Math.min(slides.length - 1, n)));

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((v) => Math.min(slides.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1));
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  return (
    <div className="scrim tour-scrim">
      <div
        className="tour"
        role="dialog"
        aria-modal="true"
        aria-label={t('tour.aria')}
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const d = e.clientX - start.current;
          start.current = null;
          if (d < -50) go(i + 1);
          if (d > 50) go(i - 1);
        }}
      >
        <div className="row between">
          <span className="label mono">{t('tour.step', { n: i + 1, total: slides.length })}</span>
          {!last && <button className="btn ghost small" onClick={close}>{t('tour.skip')}</button>}
        </div>

        <div className="tour-viewport">
          <div className="tour-track" style={{ transform: `translateX(-${i * 100}%)` }}>
            {slides.map((s, n) => (
              <section className="tour-slide" key={n} aria-hidden={n !== i}>
                {s.art}
                <h2>{s.title}</h2>
                <p className="muted">{s.text}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="tour-dots" role="tablist">
          {slides.map((s, n) => (
            <button key={n} role="tab" aria-selected={n === i} aria-label={s.title} onClick={() => go(n)} />
          ))}
        </div>

        <div className="row" style={{ gap: 8 }}>
          {i > 0 && <button className="btn" onClick={() => go(i - 1)}>{t('common.back')}</button>}
          <button className="btn primary grow" onClick={() => (last ? close() : go(i + 1))}>
            {last ? t('tour.start') : t('tour.next')}
          </button>
        </div>
        <p className="tour-hint mono muted">{t('tour.hint')}</p>
      </div>
    </div>
  );
}
