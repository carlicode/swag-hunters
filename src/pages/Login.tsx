import { tr as t, useI18n, type Key } from '../i18n';
import { LangSwitch } from '../i18n/LangSwitch';
import { useRef, useState } from 'react';
import { Collapse } from '../components/Collapse';
import { PasswordInput } from '../components/PasswordInput';
import { Seg } from '../components/Seg';
import { Field } from '../components/ui';
import { api } from '../lib/api';
import { useRoute } from '../router';

type Mode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

// Códigos ISO; el nombre se muestra en el idioma elegido y se guarda en inglés para que sea uno solo.
const COUNTRIES = [
  'BO', 'AR', 'BR', 'CL', 'CO', 'CR', 'CU', 'EC', 'SV', 'ES', 'US', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR',
  'DO', 'UY', 'VE', 'CA', 'GB', 'DE', 'FR', 'IT', 'IN', 'JP',
];
const countryName = (code: string, l: string) => new Intl.DisplayNames([l], { type: 'region' }).of(code) ?? code;

/** Traduce los errores de Cognito a mensajes que se entienden. */
function friendly(e: unknown): string {
  const name = (e as { name?: string })?.name ?? '';
  switch (name) {
    case 'UsernameExistsException': return t('auth.err.exists');
    case 'NotAuthorizedException':
    case 'UserNotFoundException': return t('auth.err.wrong');
    case 'CodeMismatchException': return t('auth.err.code');
    case 'ExpiredCodeException': return t('auth.err.expired');
    case 'InvalidPasswordException': return t('auth.err.password');
    case 'InvalidParameterException': return t('auth.err.param');
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException': return t('auth.err.limit');
    case 'NetworkError': return t('auth.err.network');
    default: return t('auth.err.other');
  }
}

const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
const passwordOk = (v: string) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

const head = (m: Mode) => [t(`auth.head.${m}` as Key), t(`auth.sub.${m}` as Key)] as const;
const cta = (m: Mode) => t(`auth.cta.${m}` as Key);

export function Login() {
  const { lang } = useI18n();
  const [route] = useRoute();
  const [mode, setMode] = useState<Mode>(route === 'crear' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  // Se conserva el último texto para que el mensaje no desaparezca de golpe mientras se pliega.
  const lastInfo = useRef('');
  const lastError = useRef('');
  if (info) lastInfo.current = info;
  if (error) lastError.current = error;

  const go = (m: Mode, note = '') => {
    setMode(m);
    setError('');
    setInfo(note);
    setCode('');
    setConfirm('');
    if (m === 'signin' || m === 'signup') history.replaceState(null, '', m === 'signup' ? '#/crear' : '#/entrar');
  };
  const enter = () => {
    location.hash = '#/descubrir';
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

  const needConfirm = async () => {
    await api.resendCode(email);
    go('confirm', t('auth.msg.notConfirmed', { email: email.trim() }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (mode === 'signin') {
        if (!emailOk(email) || !password) throw Object.assign(new Error(), { name: 'NotAuthorizedException' });
        try {
          const r = await api.signIn(email, password);
          if (r === 'confirm') await needConfirm();
          else enter();
        } catch (err) {
          if ((err as { name?: string }).name === 'UserNotConfirmedException') return needConfirm();
          throw err;
        }
      } else if (mode === 'signup') {
        if (name.trim().length < 2) return setError(t('auth.v.name'));
        if (!country) return setError(t('auth.v.country'));
        if (!emailOk(email)) return setError(t('auth.v.email'));
        if (!passwordOk(password)) return setError(t('auth.err.password'));
        if (password !== confirm) return setError(t('auth.v.mismatch'));
        await api.signUp({ name, country, email, password });
        go('confirm', t('auth.msg.codeSent', { email: email.trim() }));
      } else if (mode === 'confirm') {
        if (code.trim().length < 4) return setError(t('auth.v.code'));
        await api.confirmSignUp(email, code);
        if (password) {
          await api.signIn(email, password);
          enter();
        } else go('signin', t('auth.msg.confirmed'));
      } else if (mode === 'forgot') {
        if (!emailOk(email)) return setError(t('auth.v.emailOnly'));
        await api.forgotPassword(email);
        go('reset', t('auth.msg.resetSent', { email: email.trim() }));
      } else if (mode === 'reset') {
        if (code.trim().length < 4) return setError(t('auth.v.code'));
        if (!passwordOk(password)) return setError(t('auth.err.password'));
        if (password !== confirm) return setError(t('auth.v.mismatch'));
        await api.resetPassword(email, code, password);
        setPassword('');
        go('signin', t('auth.msg.resetDone'));
      }
    });
  };

  const tabs = mode === 'signin' || mode === 'signup';
  const fineParts = t('auth.fine').split(/(\{terms\}|\{privacy\})/);
  const [title, sub] = head(mode);

  return (
    <main className="login">
      <div className="box">
        <div className="row between">
          <a className="linkbtn" href="#/">{t('auth.home')}</a>
          <div className="row" style={{ gap: 10 }}>
            <span className="wordmark"><i />SWAG<span>/</span>HUNTERS</span>
            <LangSwitch className="small" />
          </div>
        </div>

        <div className="auth-head swap" key={mode}>
          <h1>{title}</h1>
          <p className="muted">{sub}</p>
        </div>

        {api.demo && <p className="banner">{t('auth.demoBanner')}</p>}

        <Collapse open={tabs}>
          <Seg
            label={t('auth.tabs')}
            value={mode === 'signup' ? 'signup' : 'signin'}
            onChange={(m) => go(m)}
            className="left"
            options={[
              { value: 'signin', label: t('auth.cta.signin') },
              { value: 'signup', label: t('auth.cta.signup') },
            ]}
          />
        </Collapse>

        <form className="form" onSubmit={submit} noValidate>
          <Collapse open={mode === 'signup'}>
            <Field label={t('auth.name')} htmlFor="lg-name">
              <input id="lg-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={t('auth.namePlaceholder')} />
            </Field>
          </Collapse>
          <Collapse open={mode === 'signup'}>
            <Field label={t('auth.country')} htmlFor="lg-country">
              <select id="lg-country" className="select" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name">
                <option value="">{t('auth.chooseCountry')}</option>
                {COUNTRIES.map((c) => ({ c, name: countryName(c, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang)).map(({ c, name }) => <option key={c} value={countryName(c, 'en')}>{name}</option>)}
                <option value="Other">{lang === 'es' ? 'Otro' : 'Other'}</option>
              </select>
            </Field>
          </Collapse>

          <Collapse open={mode !== 'confirm' && mode !== 'reset'}>
            <Field label={t('auth.email')} htmlFor="lg-email">
              <input id="lg-email" type="email" inputMode="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder={t('auth.emailPlaceholder')} />
            </Field>
          </Collapse>

          <Collapse open={mode === 'confirm' || mode === 'reset'}>
            <Field label={t('auth.code')} htmlFor="lg-code" hint={t('auth.codeHint')}>
              <input id="lg-code" className="input mono" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" placeholder="123456" />
            </Field>
          </Collapse>

          <Collapse open={mode === 'signin' || mode === 'signup' || mode === 'reset'}>
            <Field
              label={mode === 'reset' ? t('auth.newPassword') : t('auth.password')}
              htmlFor="lg-pass"
              hint={mode === 'signin' ? undefined : t('auth.passHint')}
            >
              <PasswordInput id="lg-pass" value={password} onChange={setPassword} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </Field>
          </Collapse>

          <Collapse open={mode === 'signup' || mode === 'reset'}>
            <Field
              label={t('auth.confirmPassword')}
              htmlFor="lg-confirm"
              hint={confirm ? (confirm === password ? t('auth.confirmHintMatch') : t('auth.confirmHintDiff')) : t('auth.confirmHintEmpty')}
            >
              <PasswordInput id="lg-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            </Field>
          </Collapse>

          <Collapse open={!!info}><p className="note" role="status">{info || lastInfo.current}</p></Collapse>
          <Collapse open={!!error}><p className="err" role="alert">{error || lastError.current}</p></Collapse>

          <button className={`btn primary block ${busy ? 'loading' : ''}`} disabled={busy}>{cta(mode)}</button>
        </form>

        <div className="row wrap" style={{ gap: 14, fontSize: 13.5, minHeight: 22 }}>
          {mode === 'signin' && <button type="button" className="linkbtn swap" onClick={() => go('forgot')}>{t('auth.forgot')}</button>}
          {mode === 'confirm' && (
            <button type="button" className="linkbtn swap" onClick={() => void run(async () => { await api.resendCode(email); setInfo(t('auth.msg.codeResent', { email: email.trim() })); })}>
              {t('auth.resend')}
            </button>
          )}
          {(mode === 'forgot' || mode === 'reset' || mode === 'confirm') && (
            <button type="button" className="linkbtn swap" onClick={() => go('signin')}>{t('auth.backToSignin')}</button>
          )}
        </div>

        <p className="fine">
          {fineParts.map((part, i) =>
            part === '{terms}' ? <a key={i} href="#/terminos">{t('auth.termsLink')}</a>
            : part === '{privacy}' ? <a key={i} href="#/privacidad">{t('auth.privacyLink')}</a>
            : part,
          )}
        </p>
      </div>
    </main>
  );
}
