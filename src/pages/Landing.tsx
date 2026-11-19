import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { IconBell, IconCheck, IconDeck, IconPin } from '../components/icons';
import '../landing.css';
import { api } from '../lib/api';
import { placeholderArt } from '../lib/art';
import { tr as t, type Key } from '../i18n';
import { LangSwitch } from '../i18n/LangSwitch';

// Ejemplos para la animación del celular: empresas ficticias y arte generado, no fotos de nadie.
// Las fotos viven en public/landing/ (no están en el repositorio). Si faltan, se usa el arte generado.
const DEMO_CARDS = [
  { company: 'Nimbus Labs', n: 1, save: true, cls: 'a', photo: '/landing/tote.jpg' },
  { company: 'Quark Cloud', n: 2, save: false, cls: 'b', photo: '/landing/termo.jpg' },
  { company: 'Pixel Forge', n: 3, save: true, cls: 'c', photo: '/landing/gorra.jpg' },
] as const;

const STEPS = [
  { tag: 'swipe()', n: 1, Icon: IconDeck },
  { tag: 'confirm()', n: 2, Icon: IconCheck },
  { tag: 'dedupe()', n: 3, Icon: IconPin },
  { tag: 'alert()', n: 4, Icon: IconBell },
] as const;

// Cada palabra entra con su propio retardo. El espacio va fuera del span: dentro de un inline-block se pierde.
const words = (text: string, start: number, cls = '') =>
  text.split(' ').map((w, i) => (
    <Fragment key={`${text}-${i}`}>
      <span className={`lp-w ${cls}`} style={{ '--d': `${(start + i) * 70}ms` } as CSSProperties}>{w}</span>{' '}
    </Fragment>
  ));

function Crosshair() {
  return (
    <svg className="lp-cross" viewBox="0 0 400 400" aria-hidden>
      <g className="lp-cross-spin" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="200" cy="200" r="190" opacity=".35" />
        <circle cx="200" cy="200" r="140" opacity=".5" />
        <circle cx="200" cy="200" r="90" opacity=".7" />
        {Array.from({ length: 36 }, (_, i) => (
          <line key={i} x1="200" y1="6" x2="200" y2={i % 3 === 0 ? 22 : 14} transform={`rotate(${i * 10} 200 200)`} opacity={i % 3 === 0 ? 0.9 : 0.4} />
        ))}
      </g>
      <g className="lp-cross-spin-r" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
        <circle cx="200" cy="200" r="115" strokeDasharray="6 22" opacity=".9" />
        <path d="M200 56v28M200 316v28M56 200h28M316 200h28" />
      </g>
      <circle className="lp-cross-dot" cx="200" cy="200" r="7" fill="var(--accent)" />
    </svg>
  );
}

function PhoneDemo() {
  return (
    <div className="lp-phone" aria-hidden>
      <div className="lp-phone-notch" />
      <div className="lp-phone-bar"><i />SWAG / HUNTERS<b>{t('lp.example')}</b></div>
      <div className="lp-deck">
        {DEMO_CARDS.map((c) => (
          <div key={c.cls} className={`lp-card ${c.cls}`}>
            <img
              src={c.photo}
              alt=""
              draggable={false}
              onError={(e) => {
                const art = placeholderArt(c.company);
                if (e.currentTarget.src !== art) e.currentTarget.src = art;
              }}
            />
            <span className={`lp-stamp ${c.save ? 'yes' : 'no'}`}>{c.save ? t('lp.stampSave') : t('lp.stampPass')}</span>
            <div className="lp-card-body">
              <span className="label">{c.company}</span>
              <strong>{t(`lp.c${c.n}.title` as Key)}</strong>
              <small><IconPin style={{ width: 12 }} /> {t(`lp.c${c.n}.ref` as Key)}</small>
              <span className="lp-live"><i /> {t('status.live')}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="lp-phone-btns"><span>✕</span><span>♥</span></div>
    </div>
  );
}

/** Página de inicio: se ve antes de crear la cuenta. */
export function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Aparece cada sección al llegar a ella.
    const reveals = el.querySelectorAll<HTMLElement>('.reveal');
    let io: IntersectionObserver | undefined;
    if (calm || !('IntersectionObserver' in window)) {
      reveals.forEach((n) => n.classList.add('in'));
    } else {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('in');
              io?.unobserve(en.target);
            }
          }),
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
      );
      reveals.forEach((n) => io!.observe(n));
    }

    // Barra superior con fondo al bajar, y un resplandor que sigue al cursor (solo con mouse).
    const onScroll = () => el.classList.toggle('scrolled', window.scrollY > 24);
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || calm) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${e.clientX}px`);
        el.style.setProperty('--my', `${e.clientY}px`);
        el.classList.add('has-pointer');
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div className="lp" ref={root}>
      <div className="lp-glow" aria-hidden />
      <div className="lp-orb" aria-hidden />

      <header className="lp-top">
        <a className="wordmark" href="#/"><i />SWAG<span>/</span>HUNTERS</a>
        <nav className="row" style={{ gap: 6 }} aria-label={t('common.mainNav')}>
          <button type="button" className="lp-link" onClick={() => document.getElementById('como')?.scrollIntoView({ behavior: 'smooth' })}>{t('lp.how')}</button>
          <LangSwitch className="small" />
          <a className="btn small" href="#/entrar">{t('lp.signIn')}</a>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-copy">
          <span className="lp-eyebrow lp-rise" style={{ '--d': '0ms' } as CSSProperties}>
            <i /> re:Invent 2026<span className="lp-hide-sm">{t('lp.eyebrowLV')}</span> · {t('lp.eyebrow')}
          </span>
          <h1 className="lp-title">
            {words(t('lp.title1'), 1)}
            <br />
            {words(t('lp.title2'), t('lp.title1').split(' ').length + 1, 'amber')}
          </h1>
          <p className="lp-lead lp-rise" style={{ '--d': '650ms' } as CSSProperties}>
            {t('lp.lead')}
          </p>
          <div className="lp-cta lp-rise" style={{ '--d': '800ms' } as CSSProperties}>
            <a className="btn primary lg" href="#/crear">{t('lp.create')}</a>
            <a className="btn lg" href="#/entrar">{t('lp.haveAccount')}</a>
          </div>
          <ul className="lp-badges lp-rise" style={{ '--d': '950ms' } as CSSProperties}>
            <li>{t('lp.b1')}</li>
            <li>{t('lp.b2')}</li>
            <li>{t('lp.b3')}</li>
          </ul>
          {api.demo && <p className="banner" style={{ alignSelf: 'flex-start' }}>{t('lp.demoBanner')}</p>}
        </div>

        <div className="lp-stage lp-rise" style={{ '--d': '500ms' } as CSSProperties}>
          <Crosshair />
          <PhoneDemo />
        </div>
      </section>

      <div className="lp-marquee" aria-hidden>
        <div className="lp-marquee-track">
          {Array.from({ length: 4 }, () => t('lp.ticker').split('|')).flat().map((w, i) => (
            <span key={i}>{w}<em>/</em></span>
          ))}
        </div>
      </div>

      <section className="lp-steps" id="como">
        <div className="lp-head reveal">
          <span className="label">{t('lp.how')}</span>
          <h2>{t('lp.howHead')}</h2>
        </div>
        <div className="lp-grid">
          {STEPS.map(({ tag, n, Icon }, i) => (
            <article key={tag} className="lp-step reveal" style={{ '--i': i } as CSSProperties}>
              <div className="lp-step-top">
                <span className="lp-ic"><Icon /></span>
                <code>{tag}</code>
              </div>
              <h3>{t(`lp.s${n}.title` as Key)}</h3>
              <p>{t(`lp.s${n}.text` as Key)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-final reveal">
        <h2>{t('lp.finalA')}<br />{t('lp.finalB')} <em>re:Invent</em>.</h2>
        <p>{t('lp.finalText')}</p>
        <div className="lp-cta">
          <a className="btn primary lg" href="#/crear">{t('lp.createFree')}</a>
          <a className="btn lg" href="#/entrar">{t('lp.signIn')}</a>
        </div>
      </section>

      <footer className="lp-foot">
        <span className="wordmark"><i />SWAG<span>/</span>HUNTERS</span>
        <p>{t('lp.foot')}</p>
        <p><a href="#/privacidad">{t('me.privacy')}</a> · <a href="#/terminos">{t('me.terms')}</a></p>
      </footer>
    </div>
  );
}
