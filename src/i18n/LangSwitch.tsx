import { Seg } from '../components/Seg';
import { useI18n, type Lang } from './index';

/** Interruptor EN | ES; recuerda la elección en localStorage. */
export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <Seg<Lang>
      label={t('common.language')}
      value={lang}
      onChange={setLang}
      className={`lang-switch ${className}`}
      options={[
        { value: 'en', label: 'EN' },
        { value: 'es', label: 'ES' },
      ]}
    />
  );
}
