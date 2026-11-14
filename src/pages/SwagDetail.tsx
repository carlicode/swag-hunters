import { useMemo, useState } from 'react';
import { IconBack, IconCheck, IconFlag, IconHeart, IconPin, IconX } from '../components/icons';
import { Photo, PhotoPicker, StatusChip } from '../components/ui';
import { api } from '../lib/api';
import { ago } from '../lib/time';
import type { ReportKind } from '../lib/types';
import { back } from '../router';
import { useStore } from '../store';

const KIND_LABEL: Record<ReportKind, string> = {
  STILL_THERE: 'Confirmó que sigue disponible',
  GONE: 'Avisó que se acabó',
  TIP: 'Dejó un tip',
  PHOTO: 'Agregó una foto',
};

export function SwagDetail({ id }: { id: string }) {
  const { swags, reports, saved, statusOf, toggleSaved, refresh, toast, user } = useStore();
  const swag = swags.find((s) => s.id === id);
  const [tip, setTip] = useState('');
  const [photo, setPhoto] = useState<Blob>();
  const [busy, setBusy] = useState(false);
  const [hero, setHero] = useState<string | undefined>();

  const mine = useMemo(() => reports.filter((r) => r.swagId === id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [reports, id]);
  if (!swag) return <p className="muted">Este swag no existe o todavía se está cargando.</p>;
  const status = statusOf(swag);
  const photos = [swag.photoKey, ...mine.map((r) => r.photoKey)].filter(Boolean) as string[];
  const shown = hero ?? photos[0];

  async function send(kind: ReportKind, text?: string, blob?: Blob) {
    // Evita apretar dos veces el mismo aviso en pocos minutos.
    const recent = mine.find((r) => r.mine && r.kind === kind && (kind === 'STILL_THERE' || kind === 'GONE') && Date.now() - +new Date(r.createdAt) < 10 * 60_000);
    if (recent) return toast('Ya avisaste eso hace un momento');
    setBusy(true);
    try {
      await api.addReport({ swagId: id, kind, text, photo: blob });
      await refresh();
      toast(kind === 'STILL_THERE' ? 'Gracias por confirmar' : kind === 'GONE' ? 'Gracias por avisar' : 'Aporte publicado');
      if (kind === 'TIP' || kind === 'PHOTO') {
        setTip('');
        setPhoto(undefined);
      }
    } catch {
      toast('No se pudo enviar. Revisa tu conexión e intenta otra vez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="row between">
        <button className="btn ghost small" onClick={back}><IconBack style={{ width: 16 }} /> Volver</button>
        <button className={`icon-btn ${saved.has(id) ? 'on' : ''}`} onClick={() => void toggleSaved(id)} aria-pressed={saved.has(id)} aria-label="Guardar"><IconHeart /></button>
      </div>

      <Photo k={shown} company={swag.company} className="hero" alt={`${swag.company}: ${swag.title}`} />
      {photos.length > 1 && (
        <div className="thumbs">
          {photos.map((k) => (
            <div key={k} onClick={() => setHero(k)}><Photo k={k} company={swag.company} /></div>
          ))}
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        <div className="row between wrap">
          <span className="label">{swag.company}</span>
          <StatusChip state={status.state} label={status.label} />
        </div>
        <h1 style={{ fontSize: 28, lineHeight: 1.1 }}>{swag.title}</h1>
        <p className="mono muted" style={{ fontSize: 12 }}>
          Subido por {swag.authorName}{swag.mine ? ' (tú)' : ''} · {ago(swag.createdAt)} · visto {ago(status.lastSeen)} por {status.confirmations}
        </p>
      </div>

      <section className="panel stack" style={{ gap: 10 }}>
        <span className="label">Cómo conseguirlo</span>
        <p className="howto">{swag.howTo}</p>
        {swag.reference && (
          <p className="row muted" style={{ fontSize: 14, gap: 6 }}><IconPin style={{ width: 16, flex: 'none' }} />{swag.reference}</p>
        )}
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <span className="label">¿Sigue ahí?</span>
        <div className="row">
          <button className="btn live grow" disabled={busy} onClick={() => void send('STILL_THERE')}><IconCheck style={{ width: 18 }} /> Sigue ahí</button>
          <button className="btn bad grow" disabled={busy} onClick={() => void send('GONE')}><IconX style={{ width: 18 }} /> Se acabó</button>
        </div>
      </section>

      <section className="panel stack">
        <span className="label">Agregar un tip o una foto</span>
        <textarea className="textarea" placeholder="Ej. Pregunta por la talla M, las demás ya no hay." value={tip} onChange={(e) => setTip(e.target.value)} aria-label="Tu tip" />
        <PhotoPicker value={photo} onChange={setPhoto} label="Agregar foto (opcional)" />
        <button className="btn primary" disabled={busy || (!tip.trim() && !photo)} onClick={() => void send(tip.trim() ? 'TIP' : 'PHOTO', tip, photo)}>
          Publicar aporte
        </button>
      </section>

      <section className="stack" style={{ gap: 6 }}>
        <span className="label">Actividad · {mine.length}</span>
        {mine.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Todavía nadie agregó nada. Tu aviso ayuda a toda la comunidad.</p>}
        <div className="timeline">
          {mine.map((r) => (
            <div className="tl" key={r.id}>
              <i className={r.kind} />
              <div>
                <p className="who">{r.mine ? 'Tú' : r.authorName} · {KIND_LABEL[r.kind]} · {ago(r.createdAt)}</p>
                {r.text && <p>{r.text}</p>}
                {r.photoKey && <Photo k={r.photoKey} company={swag.company} className="" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {!swag.mine && (
        <button className="btn ghost small" style={{ alignSelf: 'flex-start' }} onClick={() => { void api.flag('SWAG', id, `reportado por ${user.id}`); toast('Gracias, lo revisaremos'); }}>
          <IconFlag style={{ width: 14 }} /> Reportar contenido
        </button>
      )}
    </>
  );
}
