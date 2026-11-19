import { tr as t } from '../i18n';
import { useState } from 'react';
import { IconEye, IconEyeOff } from './icons';

/** Campo de contraseña con un ojo para verla u ocultarla. El foco se queda en el campo al tocar el ojo. */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="pw">
      <input id={id} type={shown ? 'text' : 'password'} className="input" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} />
      <button
        type="button"
        className="pw-btn"
        aria-label={shown ? t('ui.hidePassword') : t('ui.showPassword')}
        aria-pressed={shown}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShown((v) => !v)}
      >
        <IconEye className="pw-open" />
        <IconEyeOff className="pw-shut" />
      </button>
    </div>
  );
}
