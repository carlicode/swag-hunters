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
      toast('Swag publicado. Gracias por compartirlo');
      go(`swag/${swag.id}`);
    } catch {
      toast('No se pudo publicar. Revisa tu conexión e intenta otra vez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" style={{ gap: 18 }} onSubmit={submit} noValidate>
      <div className="row between">
        <button type="button" className="btn ghost small" onClick={back}><IconBack style={{ width: 16 }} /> Cancelar</button>
        <span className="label">Nuevo swag</span>
      </div>
      <h1 style={{ fontSize: 26 }}>Subir un swag</h1>

      <PhotoPicker value={photo} onChange={setPhoto} label="Foto del stand o del swag" hint="Una foto donde se vea el stand ayuda a que lo encuentren." />
      <CompanyField value={company} onChange={(v) => { setCompany(v); setDistinct(false); }} known={swags} />

      {mustChoose && (
        <div className="suggest" role="region" aria-label="Swags de esta empresa">
          <p><strong>Ya hay swag de {sameCompany[0].company}.</strong> ¿Es alguno de estos? Así sumas tu aviso en vez de duplicarlo.</p>
          {sameCompany.map((s) => {
            const st = statusOf(s);
            return (
              <div className="item" key={s.id}>
                <Photo k={s.photoKey} company={s.company} />
                <div className="grow">
                  <strong style={{ fontSize: 14 }}>{s.title}</strong>
                  <div><StatusChip state={st.state} label={st.label} /></div>
                </div>
                <a className="btn small primary" href={`#/swag/${s.id}`}>Es este</a>
              </div>
            );
          })}
          <button type="button" className="btn small" onClick={() => setDistinct(true)}>Es un swag distinto</button>
        </div>
      )}

      {!mustChoose && (
        <>
          <Field label="Qué es" htmlFor="t">
            <input id="t" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Gorra bordada" />
          </Field>
          <Field label="Cómo conseguirlo" htmlFor="h" hint="Qué hay que hacer: escanear gafete, hacer una demo, llegar temprano…">
            <textarea id="h" className="textarea" value={howTo} onChange={(e) => setHowTo(e.target.value)} placeholder="Ej. Escanea tu gafete y responde 3 preguntas." />
          </Field>
          <Field label="Referencia para encontrarlo" htmlFor="r" hint="Dónde está el stand: pasillo, número o algo cercano.">
            <input id="r" className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej. Pasillo C, frente al escenario pequeño" />
          </Field>
          <button className="btn primary block" disabled={!ready || busy}>{busy ? 'Publicando…' : 'Publicar swag'}</button>
          {!ready && <p className="mono muted" style={{ fontSize: 11.5, textAlign: 'center' }}>Faltan: {[!photo && 'foto', !company.trim() && 'empresa', !title.trim() && 'qué es', !howTo.trim() && 'cómo conseguirlo', !reference.trim() && 'referencia'].filter(Boolean).join(', ')}</p>}
        </>
      )}
    </form>
  );
}
