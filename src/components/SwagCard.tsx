import { ago } from '../lib/time';
import type { Swag } from '../lib/types';
import type { SwagStatus } from '../lib/status';
import { IconPin } from './icons';
import { Photo, StatusChip } from './ui';

export function SwagBody({ swag, status }: { swag: Swag; status: SwagStatus }) {
  return (
    <>
      <div className="row between">
        <span className="label">{swag.company}</span>
        <StatusChip state={status.state} label={status.label} />
      </div>
      <h2>{swag.title}</h2>
      {swag.reference && (
        <p className="ref">
          <IconPin />
          <span>{swag.reference}</span>
        </p>
      )}
      <p className="mono muted" style={{ fontSize: 11.5 }}>
        {status.confirmations} {status.confirmations === 1 ? 'persona lo vio' : 'personas lo vieron'} · {ago(status.lastSeen)} · {swag.authorName}
      </p>
    </>
  );
}

/** Fila compacta para la vista de lista, guardados y búsquedas. */
export function SwagRow({ swag, status }: { swag: Swag; status: SwagStatus }) {
  return (
    <a className="lcard" href={`#/swag/${swag.id}`}>
      <Photo k={swag.photoKey} company={swag.company} />
      <div className="meta grow">
        <span className="label">{swag.company}</span>
        <h3>{swag.title}</h3>
        <div className="sub">
          <StatusChip state={status.state} label={status.label} />
          <span className="mono">{ago(status.lastSeen)}</span>
        </div>
        {swag.reference && <span className="sub"><IconPin style={{ width: 13, height: 13 }} />{swag.reference}</span>}
      </div>
    </a>
  );
}
