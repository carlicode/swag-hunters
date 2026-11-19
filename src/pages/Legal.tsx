import { useI18n } from '../i18n';
import { LangSwitch } from '../i18n/LangSwitch';
import type { ReactNode } from 'react';

// Correo de contacto que se muestra en las páginas legales. Se define al compilar: VITE_CONTACT_EMAIL=tu@correo.com
const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
const UPDATED = '14 de noviembre de 2026';
const KEEP_UNTIL = '3 de enero de 2027';
const UPDATED_EN = 'November 14, 2026';
const KEEP_UNTIL_EN = 'January 3, 2027';

const Contact = () =>
  CONTACT ? <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : <strong>[contact email not set]</strong>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="stack" style={{ gap: 8 }}>
      <h2 style={{ fontSize: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

function PrivacyEs() {
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

function TermsEs() {
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


function PrivacyEn() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Privacy policy</h1>
      <p className="mono muted" style={{ fontSize: 12 }}>Last updated: {UPDATED_EN}</p>
      <p>
        SWAG HUNTERS is an unofficial, community-made app (Carli Code, @carli.code) to find swag and contests during AWS re:Invent 2026.
        It has no relation to Amazon Web Services or re:Invent. Here we explain what data we use and why.
      </p>

      <Section title="What data we receive">
        <p><strong>When you create your account</strong>: your name, your country, your email and a password you choose. Amazon Cognito stores the password encrypted and we never see it. We email you a code to confirm the email is yours and, if you need it, to recover your password.</p>
        <p><strong>What you post</strong>: photos of booths and swag, text (company, what it is, how to get it, references, tips), "still there" or "gone" reports, contests and the swag you save.</p>
        <p><strong>Your alerts</strong>: the contest, the time and how many minutes before you want the reminder, along with your email to send it.</p>
        <p><strong>Content reports</strong> you send about other people's posts.</p>
      </Section>

      <Section title="What we use it for">
        <p>To let you sign in, show who posted each swag (with your name), email you the alerts you ask for and keep the content tidy and free of abuse.</p>
        <p>Next to what you post we show <strong>your first name and the initial of your last name</strong> (for example, "Ana R."), visible to other signed-in people. Your email is never shown to other people.</p>
        <p>We don't sell your data, we don't show ads and we don't use analytics or tracking tools.</p>
      </Section>

      <Section title="Who we share it with">
        <p>Only with the services that make the app work: Amazon Web Services (Cognito for accounts, DynamoDB and S3 to store data, and Lambda and SES to send emails). We don't share it with anyone else.</p>
      </Section>

      <Section title="How long we keep it">
        <p>Until <strong>{KEEP_UNTIL_EN}</strong>, a few weeks after the event. After that we delete accounts, posts, photos and alerts.</p>
      </Section>

      <Section title="Your rights">
        <p>You can cancel your alerts from the app at any time. To have your account and everything you posted deleted before that date, write to <Contact /> and we will do it within 7 days.</p>
      </Section>

      <Section title="Storage in your browser">
        <p>We store in your browser what is needed to keep your session, remember your language and remember which swag you passed in the deck. We don't use advertising cookies.</p>
      </Section>

      <Section title="Minors and changes">
        <p>The app is not aimed at children under 13. If we change this policy, we will update the date above.</p>
      </Section>

      <Section title="Contact">
        <p>For any question about your data: <Contact />.</p>
      </Section>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Terms of use</h1>
      <p className="mono muted" style={{ fontSize: 12 }}>Last updated: {UPDATED_EN}</p>
      <p>By using SWAG HUNTERS you accept these terms. They are few and simple.</p>

      <Section title="What this app is">
        <p>A free, unofficial, community-made tool to share where there is swag and contests during AWS re:Invent 2026. It is not affiliated with, sponsored or endorsed by Amazon Web Services or re:Invent. Company and event names belong to their owners.</p>
      </Section>

      <Section title="The community provides the information">
        <p>What you see is posted by other people. We don't guarantee it is accurate or that the swag or contest is still available. The conditions to get swag are set by the companies, not by this app. Check at the booth.</p>
      </Section>

      <Section title="What you can't do">
        <p>Post false, misleading or offensive content, or content that infringes other people's rights.</p>
        <p>Upload photos where people can be identified without their consent. Photograph the booth or the product, not people.</p>
        <p>Spam, impersonate another person or a company, or try to access data that isn't yours.</p>
      </Section>

      <Section title="What you post">
        <p>You still own your content. By posting it you give us permission to show it to other people inside the app while it runs. You guarantee you have the right to share it.</p>
      </Section>

      <Section title="Moderation">
        <p>We may remove content or accounts that break these rules, without notice. You can report any post with the "Report content" button.</p>
      </Section>

      <Section title="No warranties">
        <p>The app is provided as is, with no availability guarantees. We are not responsible for swag you don't find, contests you don't win or alerts that arrive late or don't arrive.</p>
      </Section>

      <Section title="Contact">
        <p>Questions or reports: <Contact />. See also the <a href="#/privacidad">privacy policy</a>.</p>
      </Section>
    </>
  );
}

/** Páginas públicas: se ven sin iniciar sesión, porque Google exige una dirección abierta para la política de privacidad. */
export function LegalPage({ kind }: { kind: 'privacidad' | 'terminos' }) {
  const { lang, t } = useI18n();
  const Body = kind === 'privacidad' ? (lang === 'es' ? PrivacyEs : PrivacyEn) : lang === 'es' ? TermsEs : TermsEn;
  return (
    <div className="app">
      <header className="topbar">
        <a className="wordmark" href="#/"><i />SWAG<span>/</span>HUNTERS</a>
        <nav className="row" style={{ gap: 14, fontSize: 13 }} aria-label="Legal">
          <a href="#/privacidad" aria-current={kind === 'privacidad' ? 'page' : undefined}>{t('legal.privacy')}</a>
          <a href="#/terminos" aria-current={kind === 'terminos' ? 'page' : undefined}>{t('legal.terms')}</a>
          <LangSwitch className="small" />
        </nav>
      </header>
      <main className="page legal" style={{ paddingBottom: 60 }}>
        <Body />
        <hr className="rule" />
        <a className="btn small" style={{ alignSelf: 'flex-start' }} href="#/">{t('legal.backToApp')}</a>
      </main>
    </div>
  );
}
