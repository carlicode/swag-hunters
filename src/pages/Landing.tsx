import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { IconBell, IconCheck, IconDeck, IconPin } from '../components/icons';
import '../landing.css';
import { api } from '../lib/api';
import { placeholderArt } from '../lib/art';

// Ejemplos para la animación del celular: empresas ficticias y arte generado, no fotos de nadie.
const DEMO_CARDS = [
  { company: 'Nimbus Labs', title: 'Tote bag crema', ref: 'Pasillo C', stamp: 'GUARDAR', cls: 'a' },
  { company: 'Quark Cloud', title: 'Termo negro', ref: 'Entrada norte', stamp: 'PASAR', cls: 'b' },
  { company: 'Pixel Forge', title: 'Gorra #swag', ref: 'Stand 980', stamp: 'GUARDAR', cls: 'c' },
];

const STEPS = [
  { tag: 'swipe()', title: 'Descubre', text: 'Desliza como en Tinder: a la derecha guardas, a la izquierda pasas. Lo disponible y confirmado hace poco sale primero.', Icon: IconDeck },
  { tag: 'confirm()', title: 'Confirma', text: 'Como Waze: avisa si sigue ahí o se acabó. El estado se actualiza con lo que reporta la gente en tiempo real.', Icon: IconCheck },
  { tag: 'dedupe()', title: 'Sin duplicados', text: 'Si alguien ya subió ese swag, la app te lo muestra y sumas tu aviso o tu foto en vez de repetirlo.', Icon: IconPin },
  { tag: 'alert()', title: 'Alertas', text: 'Pide un aviso por correo unos minutos antes de un concurso y no te lo pierdas, aunque estés en otro pasillo.', Icon: IconBell },
];

const TICKER = ['TOTE BAGS', 'TERMOS', 'GORRAS', 'STICKERS', 'POLERAS', 'MOCHILAS', 'POWER BANKS', 'SORTEOS', 'RIFAS', 'LIBRETAS'];

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
      <div className="lp-phone-bar"><i />SWAG / HUNTERS<b /></div>
      <div className="lp-deck">
        {DEMO_CARDS.map((c) => (
          <div key={c.title} className={`lp-card ${c.cls}`}>
            <img src={placeholderArt(c.company)} alt="" draggable={false} />
            <span className={`lp-stamp ${c.stamp === 'PASAR' ? 'no' : 'yes'}`}>{c.stamp}</span>
            <div className="lp-card-body">
              <span className="label">{c.company}</span>
              <strong>{c.title}</strong>
              <small><IconPin style={{ width: 12 }} /> {c.ref}</small>
              <span className="lp-live"><i /> Disponible ahora</span>
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
        <nav className="row" style={{ gap: 6 }} aria-label="Principal">
          <button type="button" className="lp-link" onClick={() => document.getElementById('como')?.scrollIntoView({ behavior: 'smooth' })}>Cómo funciona</button>
          <a className="btn small" href="#/entrar">Entrar</a>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-copy">
          <span className="lp-eyebrow lp-rise" style={{ '--d': '0ms' } as CSSProperties}>
            <i /> re:Invent 2026<span className="lp-hide-sm"> · Las Vegas</span> · no oficial
          </span>
          <h1 className="lp-title">
            {words('Encuentra el swag', 1)}
            <br />
            {words('antes de que se acabe.', 4, 'amber')}
          </h1>
          <p className="lp-lead lp-rise" style={{ '--d': '650ms' } as CSSProperties}>
            La comunidad sube lo que ve en los stands, confirma si sigue disponible y avisa qué hay que hacer para conseguirlo. Con concursos y alertas por correo.
          </p>
          <div className="lp-cta lp-rise" style={{ '--d': '800ms' } as CSSProperties}>
            <a className="btn primary lg" href="#/crear">Crear cuenta</a>
            <a className="btn lg" href="#/entrar">Ya tengo cuenta</a>
          </div>
          <ul className="lp-badges lp-rise" style={{ '--d': '950ms' } as CSSProperties}>
            <li>Gratis</li>
            <li>Sin descargar nada</li>
            <li>Hecha por la comunidad</li>
          </ul>
          {api.demo && <p className="banner" style={{ alignSelf: 'flex-start' }}>MODO DEMO · datos de ejemplo, sin AWS</p>}
        </div>

        <div className="lp-stage lp-rise" style={{ '--d': '500ms' } as CSSProperties}>
          <Crosshair />
          <PhoneDemo />
        </div>
      </section>

      <div className="lp-marquee" aria-hidden>
        <div className="lp-marquee-track">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>{t}<em>/</em></span>
          ))}
        </div>
      </div>

      <section className="lp-steps" id="como">
        <div className="lp-head reveal">
          <span className="label">Cómo funciona</span>
          <h2>Cuatro cosas, nada más.</h2>
        </div>
        <div className="lp-grid">
          {STEPS.map(({ tag, title, text, Icon }, i) => (
            <article key={title} className="lp-step reveal" style={{ '--i': i } as CSSProperties}>
              <div className="lp-step-top">
                <span className="lp-ic"><Icon /></span>
                <code>{tag}</code>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-final reveal">
        <h2>Hecha por y para quienes<br />van a <em>re:Invent</em>.</h2>
        <p>Crear tu cuenta toma un minuto: nombre, país y correo. Te llega un código para confirmar y listo.</p>
        <div className="lp-cta">
          <a className="btn primary lg" href="#/crear">Crear cuenta gratis</a>
          <a className="btn lg" href="#/entrar">Entrar</a>
        </div>
      </section>

      <footer className="lp-foot">
        <span className="wordmark"><i />SWAG<span>/</span>HUNTERS</span>
        <p>App no oficial hecha por la comunidad. No tiene relación con AWS ni con re:Invent.</p>
        <p><a href="#/privacidad">Privacidad</a> · <a href="#/terminos">Términos</a></p>
      </footer>
    </div>
  );
}
