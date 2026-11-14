import type { ReactNode } from 'react';

// Correo de contacto que se muestra en las páginas legales. Se define al compilar: VITE_CONTACT_EMAIL=tu@correo.com
const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
const UPDATED = '14 de noviembre de 2026';
const KEEP_UNTIL = '3 de enero de 2027';

const Contact = () =>
  CONTACT ? <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : <strong>[falta definir el correo de contacto]</strong>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="stack" style={{ gap: 8 }}>
      <h2 style={{ fontSize: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

function Privacy() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Política de privacidad</h1>
      <p className="mono muted" style={{ fontSize: 12 }}>Última actualización: {UPDATED}</p>
      <p>
        SWAG HUNTERS es una app no oficial, hecha por la comunidad (Carli Code, @carli.code) para encontrar swag y concursos durante AWS re:Invent 2026.
        No tiene relación con Amazon Web Services ni con re:Invent. Aquí explicamos qué datos usamos y para qué.
      </p>

      <Section title="Qué datos recibimos">
        <p><strong>Al crear tu cuenta</strong>: tu nombre, tu país, tu correo y una contraseña que tú eliges. La contraseña la guarda Amazon Cognito de forma cifrada y nosotros nunca la vemos. Te enviamos un código por correo para confirmar que el correo es tuyo y, si lo necesitas, para recuperar tu contraseña.</p>
        <p><strong>Lo que tú publicas</strong>: fotos de stands y de swag, textos (empresa, qué es, cómo conseguirlo, referencias, tips), avisos de "sigue ahí" o "se acabó", concursos y los swags que guardas.</p>
        <p><strong>Tus alertas</strong>: el concurso, la hora y cuántos minutos antes quieres el aviso, junto con tu correo para enviártelo.</p>
        <p><strong>Reportes de contenido</strong> que envías sobre publicaciones de otras personas.</p>
      </Section>

      <Section title="Para qué los usamos">
        <p>Para que puedas entrar a la app, mostrar quién subió cada swag (con tu nombre), enviarte por correo las alertas que tú pidas y mantener el contenido ordenado y sin abusos.</p>
        <p>Junto a lo que publicas se muestra <strong>tu nombre y la inicial de tu apellido</strong> (por ejemplo, "Ana R."), visible para las demás personas con sesión. Tu correo nunca se muestra a otras personas.</p>
        <p>No vendemos tus datos, no mostramos publicidad y no usamos herramientas de analítica ni seguimiento.</p>
      </Section>

      <Section title="Con quién se comparten">
        <p>Solo con los servicios que hacen funcionar la app: Amazon Web Services (Cognito para las cuentas, DynamoDB y S3 para guardar los datos, y Lambda y SES para enviar los correos). No los compartimos con nadie más.</p>
      </Section>

      <Section title="Cuánto tiempo los guardamos">
        <p>Hasta el <strong>{KEEP_UNTIL}</strong>, unas semanas después del evento. Después borramos las cuentas, las publicaciones, las fotos y las alertas.</p>
      </Section>

      <Section title="Tus derechos">
        <p>Puedes cancelar tus alertas desde la app en cualquier momento. Para que borremos tu cuenta y todo lo que publicaste antes de esa fecha, escríbenos a <Contact /> y lo hacemos en un máximo de 7 días.</p>
      </Section>

      <Section title="Almacenamiento en tu navegador">
        <p>Guardamos en tu navegador lo necesario para mantener tu sesión y recordar qué swags pasaste en el mazo. No usamos cookies de publicidad.</p>
      </Section>

      <Section title="Menores y cambios">
        <p>La app no está dirigida a menores de 13 años. Si cambiamos esta política, actualizaremos la fecha de arriba.</p>
      </Section>

      <Section title="Contacto">
        <p>Para cualquier duda sobre tus datos: <Contact />.</p>
      </Section>
    </>
  );
}

function Terms() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Términos de uso</h1>
      <p className="mono muted" style={{ fontSize: 12 }}>Última actualización: {UPDATED}</p>
      <p>Al usar SWAG HUNTERS aceptas estos términos. Son pocos y sencillos.</p>

      <Section title="Qué es esta app">
        <p>Una herramienta gratuita y no oficial, hecha por la comunidad, para compartir dónde hay swag y concursos durante AWS re:Invent 2026. No está afiliada, patrocinada ni respaldada por Amazon Web Services ni por re:Invent. Los nombres de empresas y eventos pertenecen a sus dueños.</p>
      </Section>

      <Section title="La información la pone la comunidad">
        <p>Lo que ves lo suben otras personas. No garantizamos que sea exacto ni que el swag o el concurso siga disponible. Las condiciones para conseguir un swag las fijan las empresas, no esta app. Verifica en el stand.</p>
      </Section>

      <Section title="Qué no puedes hacer">
        <p>Publicar contenido falso, engañoso, ofensivo o que infrinja derechos de otras personas.</p>
        <p>Subir fotos donde se identifique a personas sin su consentimiento. Fotografía el stand o el producto, no a la gente.</p>
        <p>Hacer spam, suplantar a otra persona o a una empresa, o intentar acceder a datos que no son tuyos.</p>
      </Section>

      <Section title="Lo que publicas">
        <p>Sigues siendo dueña o dueño de tu contenido. Al publicarlo nos das permiso para mostrarlo a las demás personas dentro de la app mientras funcione. Garantizas que tienes derecho a compartirlo.</p>
      </Section>

      <Section title="Moderación">
        <p>Podemos quitar contenido o cuentas que incumplan estas reglas, sin previo aviso. Puedes reportar cualquier publicación con el botón "Reportar contenido".</p>
      </Section>

      <Section title="Sin garantías">
        <p>La app se ofrece tal como está, sin garantías de disponibilidad. No somos responsables por swag que no encuentres, concursos que no ganes ni alertas que lleguen tarde o no lleguen.</p>
      </Section>

      <Section title="Contacto">
        <p>Dudas o reportes: <Contact />. Consulta también la <a href="#/privacidad">política de privacidad</a>.</p>
      </Section>
    </>
  );
}

/** Páginas públicas: se ven sin iniciar sesión, porque Google exige una dirección abierta para la política de privacidad. */
export function LegalPage({ kind }: { kind: 'privacidad' | 'terminos' }) {
  return (
    <div className="app">
      <header className="topbar">
        <a className="wordmark" href="#/"><i />SWAG<span>/</span>HUNTERS</a>
        <nav className="row" style={{ gap: 14, fontSize: 13 }} aria-label="Legal">
          <a href="#/privacidad" aria-current={kind === 'privacidad' ? 'page' : undefined}>Privacidad</a>
          <a href="#/terminos" aria-current={kind === 'terminos' ? 'page' : undefined}>Términos</a>
        </nav>
      </header>
      <main className="page legal" style={{ paddingBottom: 60 }}>
        {kind === 'privacidad' ? <Privacy /> : <Terms />}
        <hr className="rule" />
        <a className="btn small" style={{ alignSelf: 'flex-start' }} href="#/">Volver a la app</a>
      </main>
    </div>
  );
}
