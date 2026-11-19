import { tr as t } from '../i18n';
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

  if (loading) return <div className="spin" role="status" aria-label={t('common.loading')} />;

  return (
    <>
      <div className="row between">
        <p className="mono muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
          <strong style={{ color: 'var(--fg)' }}>{all.filter((i) => i.status.state === 'LIVE').length}</strong> {t('disc.availableNow')}
          <br />
          {t('disc.total', { n: filtered.length })}
        </p>
        <Seg
          label={t('disc.view')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'deck', label: <><IconGrid style={{ width: 14, verticalAlign: -2 }} /> {t('disc.deck')}</> },
            { value: 'list', label: <><IconList style={{ width: 14, verticalAlign: -2 }} /> {t('disc.list')}</> },
          ]}
        />
      </div>

      <div className="row">
        <input className="input" placeholder={t('disc.search')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('disc.searchAria')} />
        <button className="btn small" aria-pressed={showGone} onClick={() => setShowGone((v) => !v)} style={showGone ? { borderColor: 'var(--accent)' } : undefined}>
          {showGone ? t('disc.showingGone') : t('disc.hidingGone')}
        </button>
      </div>

      {swags.length === 0 && (
        <Empty title={t('disc.emptyTitle')} text={t('disc.emptyText')}>
          <button className="btn primary" onClick={() => go('nuevo')}>{t('disc.uploadSwag')}</button>
        </Empty>
      )}

      {swags.length > 0 && mode === 'deck' && (
        deckItems.length ? (
          <Deck
            items={deckItems}
            onSave={(s) => {
              void toggleSaved(s.id);
              toast(t('disc.savedToast'));
            }}
            onPass={(s) => pass(s.id)}
          />
        ) : (
          <Empty title={t('disc.allSeenTitle')} text={t('disc.allSeenText')}>
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={resetPassed}>{t('disc.seePassed')}</button>
              <button className="btn primary" onClick={() => go('nuevo')}>{t('disc.uploadSwag')}</button>
            </div>
          </Empty>
        )
      )}

      {swags.length > 0 && mode === 'list' && (
        <div className="grid two">
          {filtered.map((i) => <SwagRow key={i.swag.id} swag={i.swag} status={i.status} />)}
          {filtered.length === 0 && <Empty title={t('disc.noResultsTitle')} text={t('disc.noResultsText')} />}
        </div>
      )}
    </>
  );
}
