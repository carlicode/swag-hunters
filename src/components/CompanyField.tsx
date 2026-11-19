import { tr as t } from '../i18n';
import { useId } from 'react';
import { similarCompanies } from '../lib/company';
import { Field } from './ui';

/** Campo de empresa con sugerencias de nombres ya usados, para que "Datadog" no se escriba de 5 maneras. */
export function CompanyField({
  value,
  onChange,
  known,
}: {
  value: string;
  onChange: (v: string) => void;
  known: { company: string; companyKey: string }[];
}) {
  const list = useId();
  const options = similarCompanies(value, known);
  const exact = options.some((o) => o.toLowerCase() === value.trim().toLowerCase());
  return (
    <Field label={t('company.label')} htmlFor={list + 'c'}>
      <input id={list + 'c'} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={t('company.placeholder')} list={list} autoComplete="off" />
      <datalist id={list}>{options.map((o) => <option key={o} value={o} />)}</datalist>
      {options.length > 0 && !exact && (
        <div className="pills" aria-label={t('company.similarAria')}>
          {options.map((o) => (
            <button type="button" className="pill" key={o} onClick={() => onChange(o)}>{o}</button>
          ))}
        </div>
      )}
    </Field>
  );
}
