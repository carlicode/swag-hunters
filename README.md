# SWAG HUNTERS

App web (PWA) para encontrar swag y concursos durante AWS re:Invent 2026. La gente sube lo que ve en los stands, confirma si sigue disponible y pone alertas por correo para los concursos con hora.

**No es oficial.** No tiene relación con AWS ni con re:Invent.

## Qué hace

| Pantalla | Para qué sirve |
|---|---|
| **Descubrir** | Mazo de tarjetas estilo Tinder: derecha guarda, izquierda pasa. También hay vista de lista y búsqueda. Lo disponible y confirmado hace poco sale primero. |
| **Detalle de swag** | Foto, cómo conseguirlo, referencia del stand, quién lo subió y su estado. Botones **Sigue ahí** y **Se acabó**, tips y fotos de otras personas. |
| **Subir swag** | Foto, empresa, qué es, cómo conseguirlo y referencia. Si ya hay swag de esa empresa, pregunta **"¿es este?"** antes de crear uno nuevo. |
| **Concursos** | Agenda por día en hora de Las Vegas, con cuenta regresiva y una campana para pedir alerta (5, 10, 15, 30 o 60 min antes). |
| **Yo** | Guardados, alertas activas y lo que subiste. |

### Cómo se evitan los duplicados

1. Al escribir la empresa, "Datadog", "datadog inc." y "DATADOG" se reconocen como la misma.
2. Si ya hay swag de esa empresa, se muestran con foto y la persona elige **Es este** (suma su aviso o foto) o **Es distinto**.
3. El estado funciona como Waze: 2 personas distintas que digan "se acabó" después de la última confirmación lo marcan agotado. Una sola lo deja en "quizá se acabó". Si nadie lo confirma en horas, pasa a "sin confirmar".

## Probarla ya (modo demo)

No necesita AWS ni Google. Los datos viven en tu navegador y las empresas del ejemplo son ficticias.

```bash
npm install
```

```bash
npm run demo
```

Abre http://localhost:5173. En el celular, usa la IP de tu computadora en la misma red.

## Publicarla de verdad

El backend usa **AWS Amplify Gen 2**: login con Google (Cognito), datos (AppSync + DynamoDB), fotos (S3) y una función que cada minuto envía las alertas por correo (SES).

### 1. Credenciales de Google (las creas tú)

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials) crea un **ID de cliente OAuth** de tipo *Aplicación web*.
2. En *URI de redireccionamiento autorizados* pon `https://<tu-dominio-cognito>.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`. El dominio de Cognito aparece después del primer despliegue.
3. Guarda el ID y el secreto en Amplify:

```bash
npx ampx sandbox secret set GOOGLE_CLIENT_ID
```

```bash
npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
```

### 2. Correos de alerta (SES)

- Verifica el dominio remitente en SES (por defecto `swag@carlicode.com`; se cambia con la variable `FROM_EMAIL`).
- Mientras SES esté en **sandbox**, solo envía a correos verificados. Para que las alertas lleguen a cualquier Gmail hay que pedir **acceso de producción** en la consola de SES. Hazlo con tiempo: tarda alrededor de un día.

### 3. Desplegar

Para probar con un backend propio de desarrollo:

```bash
npx ampx sandbox
```

Para producción, conecta el repositorio a **Amplify Hosting** (el archivo `amplify.yml` ya está listo) y define `APP_URL` con la URL final para que Google acepte el regreso del login.

## Video de demo

La carpeta `video/` graba la app real (en modo demo) dentro de un marco de celular con efectos tech y le pone música original sintetizada. El resultado es un video vertical de 1080×1920, unos 48 segundos.

Las fotos y los videos **no están en el repositorio** (son de terceros y pesan). Para generarlo, pon tus fotos en `video/assets/` con estos nombres: `tote.jpg`, `termo.jpg`, `mochila.jpg`, `gorra.jpg` y `polo.jpg`.

Necesitas Chrome y ffmpeg instalados. Desde la raíz del proyecto:

```bash
cd video && npm install && cd ..
```

```bash
VITE_DEMO=1 npx vite --port 5199 --strictPort
```

En otra terminal, graba (tarda cerca de un minuto):

```bash
node video/record.mjs
```

Compone la música con los sonidos sincronizados a cada acción (usa la duración que imprime ffprobe):

```bash
python3 video/make_music.py 48.4
```

| Archivo | Qué hace |
|---|---|
| `video/stage.html` | Escenario 9:16: marco de celular, subtítulos, terminal y contadores |
| `video/record.mjs` | Maneja la app como una persona (desliza, toca, escribe) y graba |
| `video/seed.mjs` | Datos de ejemplo y reloj fijo en el martes de re:Invent |
| `video/make_music.py` | Música original a 120 BPM, sin muestras ni licencias |

## Estructura

```
amplify/            backend: auth, data, storage y función send-alerts
src/lib/            datos (AWS y demo), estado de swag, hora de Las Vegas, empresas
src/pages/          pantallas
src/components/     mazo, tarjetas, campos, alertas
public/             manifest, service worker e íconos
video/              grabación del video de demo y su música
```

## Límites conocidos

- La subida de fotos necesita conexión. Si falla, el formulario conserva lo escrito y se reintenta. Una cola sin conexión que envíe sola al volver la señal queda pendiente.
- Las listas se cargan completas (pensado para un evento de pocos miles de aportes).
- Los reportes de contenido se guardan y se revisan desde la consola de AWS; todavía no hay panel de moderación.
- Las horas usan la hora estándar del Pacífico (UTC-8), que rige durante todo el evento.

## Contribuir / Contributing

Aceptamos pull requests. Abre un issue o un PR con tu idea, arreglo o traducción.
Pull requests are welcome: open an issue or a PR with your idea, fix or translation.

La app tiene inglés y español (`src/i18n/en.ts` y `src/i18n/es.ts`); si agregas texto, agrega la clave en los dos.
The app ships in English and Spanish (`src/i18n/en.ts` and `src/i18n/es.ts`); add new keys to both.

Autora / Author: **@carli.code** · carli.f.roman@gmail.com
