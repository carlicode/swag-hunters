import { tr as t } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { go } from '../router';
import type { Swag } from '../lib/types';
import type { SwagStatus } from '../lib/status';
import { IconHeart, IconInfo, IconX } from './icons';
import { SwagBody } from './SwagCard';
import { Photo } from './ui';

interface Item {
  swag: Swag;
  status: SwagStatus;
}

const THRESHOLD = 90; // píxeles de arrastre para decidir

/**
 * Mazo de tarjetas: derecha guarda, izquierda pasa. También funciona con flechas del teclado
 * y con los botones de abajo. Un toque abre el detalle.
 */
export function Deck({ items, onSave, onPass }: { items: Item[]; onSave: (s: Swag) => void; onPass: (s: Swag) => void }) {
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const [leaving, setLeaving] = useState<'save' | 'pass' | null>(null);
  const start = useRef<{ x: number; id: number; moved: boolean } | null>(null);
  const top = items[0];

  function decide(dir: 'save' | 'pass') {
    if (!top || leaving) return;
    setLeaving(dir);
    setDx(dir === 'save' ? 700 : -700);
    window.setTimeout(() => {
      (dir === 'save' ? onSave : onPass)(top.swag);
      setLeaving(null);
      setDx(0);
    }, 240);
  }

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches('input,textarea,select')) return;
      if (e.key === 'ArrowRight') decide('save');
      if (e.key === 'ArrowLeft') decide('pass');
      if (e.key === 'Enter' && top) go(`swag/${top.swag.id}`);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const onDown = (e: React.PointerEvent) => {
    if (leaving) return;
    start.current = { x: e.clientX, id: e.pointerId, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag(true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const d = e.clientX - start.current.x;
    if (Math.abs(d) > 6) start.current.moved = true;
    setDx(d);
  };
  const onUp = () => {
    if (!start.current) return;
    const { moved } = start.current;
    start.current = null;
    setDrag(false);
    if (dx > THRESHOLD) return decide('save');
    if (dx < -THRESHOLD) return decide('pass');
    setDx(0);
    if (!moved && top) go(`swag/${top.swag.id}`);
  };

  const progress = Math.max(-1, Math.min(1, dx / THRESHOLD));
  return (
    <div className="deckwrap">
      <div className="deck">
        {items
          .slice(0, 3)
          .map((it, i) => {
            const isTop = i === 0;
            const style: React.CSSProperties = isTop
              ? { transform: `translateX(${dx}px) rotate(${dx / 22}deg)`, opacity: leaving ? 0 : 1, zIndex: 3, cursor: 'grab' }
              : { transform: `scale(${1 - i * 0.045}) translateY(${i * 14}px)`, zIndex: 3 - i, opacity: 1 - i * 0.25, pointerEvents: 'none' };
            return (
              <article
                key={it.swag.id}
                className={`dcard ${isTop && drag ? 'dragging' : ''}`}
                style={style}
                onPointerDown={isTop ? onDown : undefined}
                onPointerMove={isTop ? onMove : undefined}
                onPointerUp={isTop ? onUp : undefined}
                onPointerCancel={isTop ? onUp : undefined}
              >
                <Photo k={it.swag.photoKey} company={it.swag.company} alt={`${it.swag.company}: ${it.swag.title}`} />
                {isTop && (
                  <>
                    <span className="stamp save" style={{ opacity: Math.max(0, progress) }}>{t('deck.save')}</span>
                    <span className="stamp pass" style={{ opacity: Math.max(0, -progress) }}>{t('deck.pass')}</span>
                  </>
                )}
                <div className="body">
                  <SwagBody swag={it.swag} status={it.status} />
                </div>
              </article>
            );
          })
          .reverse()}
      </div>
      <div className="deckbtns">
        <button className="round pass" onClick={() => decide('pass')} aria-label={t('deck.pass')}><IconX /></button>
        <button className="round info" onClick={() => top && go(`swag/${top.swag.id}`)} aria-label={t('deck.detailAria')}><IconInfo /></button>
        <button className="round save" onClick={() => decide('save')} aria-label={t('deck.save')}><IconHeart /></button>
      </div>
      <p className="mono muted deckhint">
        {t('deck.hint')}
      </p>
    </div>
  );
}
