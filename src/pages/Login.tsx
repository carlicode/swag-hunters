import { useState } from 'react';
import { IconGoogle } from '../components/icons';
import { api } from '../lib/api';

export function Login() {
  const [busy, setBusy] = useState(false);
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
        {api.demo && <p className="banner">MODO DEMO · sin Google ni AWS, los datos viven solo en este navegador</p>}
        <button
          className="btn gbtn block"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void api.signIn().finally(() => setBusy(false));
          }}
        >
          <IconGoogle />
          {api.demo ? 'Entrar a la demo' : 'Continuar con Google'}
        </button>
        <p className="fine">
          App no oficial hecha por la comunidad. No tiene relación con AWS ni con re:Invent. Solo usamos tu nombre y tu correo para mostrar quién subió cada swag y enviarte tus alertas.
          {' '}Al continuar aceptas los <a href="#/terminos">términos</a> y la <a href="#/privacidad">política de privacidad</a>.
        </p>
      </div>
    </main>
  );
}
