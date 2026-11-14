import { useMemo, useState } from 'react';
import { Deck } from '../components/Deck';
import { Seg } from '../components/Seg';
import { IconGrid, IconList } from '../components/icons';
import { SwagRow } from '../components/SwagCard';
import { Empty } from '../components/ui';
import { companyKey } from '../lib/company';
import { discoverOrder } from '../lib/status';
import { go } from '../router';
import { useStore } from '../store';

const PASSED = 'swag-hunters-passed';
const readPassed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(PASSED) ?? '[]');
  } catch {
    return [];
  }
};

export function Discover() {
  const { swags, loading, saved, statusOf, toggleSaved, toast } = useStore();
  const [passed, setPassed] = useState<string[]>(readPassed);
  const [mode, setMode] = useState<'deck' | 'list'>('deck');
  const [showGone, setShowGone] = useState(false);
  const [q, setQ] = useState('');

  const all = useMemo(
    () => swags.map((swag) => ({ swag, status: statusOf(swag) })).sort((a, b) => discoverOrder(a.status, b.status)),
    [swags, statusOf],
  );
  const visible = all.filter((i) => showGone || i.status.state !== 'GONE');
  const key = companyKey(q);
  const filtered = key ? visible.filter((i) => i.swag.companyKey.includes(key) || i.swag.title.toLowerCase().includes(q.toLowerCase())) : visible;
  const deckItems = filtered.filter((i) => !saved.has(i.swag.id) && !passed.includes(i.swag.id));

  const pass = (id: string) => {
    const next = [...passed, id];
    setPassed(next);
    try {
      localStorage.setItem(PASSED, JSON.stringify(next));
    } catch {
      /* sin almacenamiento */
    }
  };
  const resetPassed = () => {
    setPassed([]);
    try {
      localStorage.removeItem(PASSED);
    } catch {
      /* sin almacenamiento */
    }
  };

  if (loading) return <div className="spin" role="status" aria-label="Cargando" />;

  return (
    <>
      <div className="row between">
        <p className="mono muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
          <strong style={{ color: 'var(--fg)' }}>{all.filter((i) => i.status.state === 'LIVE').length}</strong> disponibles ahora
          <br />
          {filtered.length} swags en total
        </p>
        <Seg
          label="Vista"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'deck', label: <><IconGrid style={{ width: 14, verticalAlign: -2 }} /> Mazo</> },
            { value: 'list', label: <><IconList style={{ width: 14, verticalAlign: -2 }} /> Lista</> },
          ]}
        />
      </div>

      <div className="row">
        <input className="input" placeholder="Buscar empresa o swag" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        <button className="btn small" aria-pressed={showGone} onClick={() => setShowGone((v) => !v)} style={showGone ? { borderColor: 'var(--accent)' } : undefined}>
          {showGone ? 'Con agotados' : 'Sin agotados'}
        </button>
      </div>

      {swags.length === 0 && (
        <Empty title="Todavía no hay swag" text="Sé la primera persona en subir uno. Toma una foto del stand y cuenta cómo conseguirlo.">
          <button className="btn primary" onClick={() => go('nuevo')}>Subir swag</button>
        </Empty>
      )}

      {swags.length > 0 && mode === 'deck' && (
        deckItems.length ? (
          <Deck
            items={deckItems}
            onSave={(s) => {
              void toggleSaved(s.id);
              toast('Guardado en tu lista');
            }}
            onPass={(s) => pass(s.id)}
          />
        ) : (
          <Empty title="Ya viste todo" text="No quedan swags nuevos con estos filtros. Mira los que guardaste o vuelve a ver los que pasaste.">
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={resetPassed}>Ver los pasados otra vez</button>
              <button className="btn primary" onClick={() => go('nuevo')}>Subir swag</button>
            </div>
          </Empty>
        )
      )}

      {swags.length > 0 && mode === 'list' && (
        <div className="grid two">
          {filtered.map((i) => <SwagRow key={i.swag.id} swag={i.swag} status={i.status} />)}
          {filtered.length === 0 && <Empty title="Sin resultados" text="Prueba con otro nombre." />}
        </div>
      )}
    </>
  );
}
