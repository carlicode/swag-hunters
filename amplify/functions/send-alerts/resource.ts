import { defineFunction } from '@aws-amplify/backend';

// Corre cada minuto, busca alertas que ya toca enviar y las manda por correo con SES.
export const sendAlerts = defineFunction({
  name: 'send-alerts',
  entry: './handler.ts',
  schedule: 'every 1m',
  timeoutSeconds: 50,
  resourceGroupName: 'data', // evita una dependencia circular con la tabla de datos
  environment: {
    // Remitente verificado en SES. Cámbialo con FROM_EMAIL al desplegar.
    FROM_EMAIL: process.env.FROM_EMAIL ?? 'swag@carlicode.com',
  },
});
