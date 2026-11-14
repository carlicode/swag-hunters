import type { ReactNode } from 'react';

/**
 * Sección que se despliega y se pliega con suavidad (alto y opacidad), en vez de aparecer o desaparecer de golpe.
 * Sigue montada al plegarse, así que conserva lo escrito; `inert` evita que se pueda enfocar mientras está oculta.
 */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`collapse ${open ? 'open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="collapse-in">
        <div className="collapse-pad">{children}</div>
      </div>
    </div>
  );
}
