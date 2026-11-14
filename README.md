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

## Estructura

```
amplify/            backend: auth, data, storage y función send-alerts
src/lib/            datos (AWS y demo), estado de swag, hora de Las Vegas, empresas
src/pages/          pantallas
src/components/     mazo, tarjetas, campos, alertas
public/             manifest, service worker e íconos
```

## Límites conocidos

- La subida de fotos necesita conexión. Si falla, el formulario conserva lo escrito y se reintenta. Una cola sin conexión que envíe sola al volver la señal queda pendiente.
- Las listas se cargan completas (pensado para un evento de pocos miles de aportes).
- Los reportes de contenido se guardan y se revisan desde la consola de AWS; todavía no hay panel de moderación.
- Las horas usan la hora estándar del Pacífico (UTC-8), que rige durante todo el evento.
