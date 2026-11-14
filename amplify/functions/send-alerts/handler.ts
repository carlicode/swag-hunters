import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
// @ts-expect-error generado por Amplify al desplegar
import { env } from '$amplify/env/send-alerts';
import type { Schema } from '../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();
const ses = new SESv2Client({});
const FROM = process.env.FROM_EMAIL ?? 'swag@carlicode.com';

// Alertas con más de 10 minutos de retraso respecto a la hora del concurso ya no sirven.
const GRACE_MS = 10 * 60 * 1000;

const timePT = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

export const handler = async () => {
  const now = new Date();
  const { data: due } = await client.models.Alert.listAlertBySentFlagAndFireAt({
    sentFlag: 'N',
    fireAt: { le: now.toISOString() },
  });

  let sent = 0;
  for (const alert of due) {
    const late = now.getTime() - new Date(alert.startsAt).getTime() > GRACE_MS;
    if (late) {
      await client.models.Alert.update({ id: alert.id, sentFlag: 'X' });
      continue;
    }
    const when = timePT(alert.startsAt);
    try {
      await ses.send(
        new SendEmailCommand({
          FromEmailAddress: `SWAG HUNTERS <${FROM}>`,
          Destination: { ToAddresses: [alert.email] },
          Content: {
            Simple: {
              Subject: { Data: `En ${alert.minutesBefore} min: ${alert.title} (${alert.company})` },
              Body: {
                Text: {
                  Data:
                    `${alert.company}: ${alert.title}\n` +
                    `Empieza a las ${when} (hora de Las Vegas), en ${alert.minutesBefore} minutos.\n\n` +
                    `Abre SWAG HUNTERS para ver qué hay que hacer.\n\n` +
                    `App no oficial, sin relación con AWS ni re:Invent.`,
                },
              },
            },
          },
        }),
      );
      await client.models.Alert.update({ id: alert.id, sentFlag: 'Y' });
      sent += 1;
    } catch (err) {
      // Si SES falla (por ejemplo, destinatario no verificado en sandbox) se reintenta en el siguiente minuto.
      console.error('No se pudo enviar la alerta', alert.id, err);
    }
  }
  return { checked: due.length, sent };
};
