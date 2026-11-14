import { useState } from 'react';
import { Field } from '../components/ui';
import { api } from '../lib/api';

type Mode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

const COUNTRIES = [
  'Bolivia', 'Argentina', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'España',
  'Estados Unidos', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Puerto Rico',
  'República Dominicana', 'Uruguay', 'Venezuela', 'Canadá', 'Reino Unido', 'Alemania', 'Francia', 'Italia', 'India',
  'Japón', 'Otro',
];

/** Traduce los errores de Cognito a mensajes que se entienden. */
function friendly(e: unknown): string {
  const name = (e as { name?: string })?.name ?? '';
  switch (name) {
    case 'UsernameExistsException': return 'Ya existe una cuenta con ese correo. Prueba entrar o recuperar tu contraseña.';
    case 'NotAuthorizedException': return 'El correo o la contraseña no son correctos.';
    case 'UserNotFoundException': return 'El correo o la contraseña no son correctos.';
    case 'CodeMismatchException': return 'Ese código no es correcto. Revisa tu correo e inténtalo de nuevo.';
    case 'ExpiredCodeException': return 'El código venció. Pide uno nuevo.';
    case 'InvalidPasswordException': return 'La contraseña debe tener mínimo 8 caracteres, con letras y números.';
    case 'InvalidParameterException': return 'Revisa los datos: alguno no es válido.';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException': return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
    case 'NetworkError': return 'No hay conexión. Revisa tu internet e inténtalo otra vez.';
    default: return 'Algo salió mal. Inténtalo otra vez en un momento.';
  }
}

const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
const passwordOk = (v: string) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

export function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const go = (m: Mode, note = '') => {
    setMode(m);
    setError('');
    setInfo(note);
    setCode('');
  };

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (mode === 'signin') {
        if (!emailOk(email) || !password) throw Object.assign(new Error(), { name: 'NotAuthorizedException' });
        try {
          const r = await api.signIn(email, password);
          if (r === 'confirm') {
            await api.resendCode(email);
            go('confirm', `Tu cuenta aún no está confirmada. Te enviamos un código a ${email.trim()}.`);
          }
        } catch (e) {
          if ((e as { name?: string }).name === 'UserNotConfirmedException') {
            await api.resendCode(email);
            go('confirm', `Tu cuenta aún no está confirmada. Te enviamos un código a ${email.trim()}.`);
            return;
          }
          throw e;
        }
      } else if (mode === 'signup') {
        if (name.trim().length < 2) return setError('Escribe tu nombre.');
        if (!country) return setError('Elige tu país.');
        if (!emailOk(email)) return setError('Escribe un correo válido.');
        if (!passwordOk(password)) return setError('La contraseña debe tener mínimo 8 caracteres, con letras y números.');
        await api.signUp({ name, country, email, password });
        go('confirm', `Te enviamos un código a ${email.trim()}. Escríbelo para confirmar tu cuenta.`);
      } else if (mode === 'confirm') {
        if (code.trim().length < 4) return setError('Escribe el código que te llegó al correo.');
        await api.confirmSignUp(email, code);
        if (password) await api.signIn(email, password);
        else go('signin', 'Cuenta confirmada. Ya puedes entrar.');
      } else if (mode === 'forgot') {
        if (!emailOk(email)) return setError('Escribe tu correo.');
        await api.forgotPassword(email);
        go('reset', `Si ese correo tiene cuenta, te enviamos un código a ${email.trim()}.`);
      } else if (mode === 'reset') {
        if (code.trim().length < 4) return setError('Escribe el código que te llegó al correo.');
        if (!passwordOk(password)) return setError('La contraseña debe tener mínimo 8 caracteres, con letras y números.');
        await api.resetPassword(email, code, password);
        setPassword('');
        go('signin', 'Listo. Entra con tu nueva contraseña.');
      }
    });
  };

  const titles: Record<Mode, string> = {
    signin: 'Entrar',
    signup: 'Crear cuenta',
    confirm: 'Confirma tu correo',
    forgot: 'Recupera tu contraseña',
    reset: 'Elige una contraseña nueva',
  };
  const cta: Record<Mode, string> = {
    signin: 'Entrar',
    signup: 'Crear cuenta',
    confirm: 'Confirmar',
    forgot: 'Enviarme el código',
    reset: 'Guardar contraseña',
  };

  return (
    <main className="login">
      <div className="box">
        <span className="wordmark"><i />SWAG<span>/</span>HUNTERS</span>
        <h1>
          Encuentra el swag
          <br />
          <em>antes de que se acabe.</em>
        </h1>
        <p className="muted">
          La gente sube lo que ve en los stands, confirma si sigue disponible y avisa qué hay que hacer para conseguirlo. Con concursos y alertas por correo.
        </p>
        {api.demo && <p className="banner">MODO DEMO · cualquier correo y contraseña sirven, y el código es 123456</p>}

        {(mode === 'signin' || mode === 'signup') && (
          <div className="seg" role="tablist" aria-label="Acceso" style={{ alignSelf: 'flex-start' }}>
            <button role="tab" type="button" aria-pressed={mode === 'signin'} onClick={() => go('signin')}>Entrar</button>
            <button role="tab" type="button" aria-pressed={mode === 'signup'} onClick={() => go('signup')}>Crear cuenta</button>
          </div>
        )}
        {mode !== 'signin' && mode !== 'signup' && <h2 style={{ fontSize: 20 }}>{titles[mode]}</h2>}

        <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <>
              <Field label="Tu nombre" htmlFor="lg-name">
                <input id="lg-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ej. Ana Rojas" />
              </Field>
              <Field label="País" htmlFor="lg-country">
                <select id="lg-country" className="select" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name">
                  <option value="">Elige tu país</option>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </>
          )}

          {mode !== 'confirm' && mode !== 'reset' && (
            <Field label="Correo" htmlFor="lg-email">
              <input id="lg-email" type="email" inputMode="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tu@correo.com" />
            </Field>
          )}

          {(mode === 'confirm' || mode === 'reset') && (
            <Field label="Código" htmlFor="lg-code" hint="Te llegó por correo. Revisa también la carpeta de spam.">
              <input id="lg-code" className="input mono" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" placeholder="123456" />
            </Field>
          )}

          {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
            <Field
              label={mode === 'reset' ? 'Contraseña nueva' : 'Contraseña'}
              htmlFor="lg-pass"
              hint={mode === 'signin' ? undefined : 'Mínimo 8 caracteres, con letras y números.'}
            >
              <input
                id="lg-pass"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </Field>
          )}

          {info && <p className="note" role="status">{info}</p>}
          {error && <p className="err" role="alert">{error}</p>}

          <button className="btn primary block" disabled={busy}>{busy ? 'Un momento…' : cta[mode]}</button>
        </form>

        <div className="row wrap" style={{ gap: 14, fontSize: 13.5 }}>
          {mode === 'signin' && <button type="button" className="linkbtn" onClick={() => go('forgot')}>¿Olvidaste tu contraseña?</button>}
          {mode === 'confirm' && (
            <button type="button" className="linkbtn" onClick={() => void run(async () => { await api.resendCode(email); setInfo(`Te enviamos otro código a ${email.trim()}.`); })}>
              Reenviar el código
            </button>
          )}
          {(mode === 'forgot' || mode === 'reset' || mode === 'confirm') && (
            <button type="button" className="linkbtn" onClick={() => go('signin')}>Volver a entrar</button>
          )}
        </div>

        <p className="fine">
          App no oficial hecha por la comunidad. No tiene relación con AWS ni con re:Invent. Usamos tu nombre, país y correo para mostrar quién subió cada swag y enviarte tus alertas.
          {' '}Al crear tu cuenta aceptas los <a href="#/terminos">términos</a> y la <a href="#/privacidad">política de privacidad</a>.
        </p>
      </div>
    </main>
  );
}
