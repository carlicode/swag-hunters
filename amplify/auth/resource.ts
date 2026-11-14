import { defineAuth, secret } from '@aws-amplify/backend';

// URL final de la app (sin / al final). Se define al desplegar: APP_URL=https://swag.ejemplo.com
const appUrl = process.env.APP_URL;

export const auth = defineAuth({
  // El correo queda habilitado por requisito de Cognito, pero la app solo muestra "Continuar con Google".
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile'],
        attributeMapping: { email: 'email', fullname: 'name' },
      },
      callbackUrls: ['http://localhost:5173/', ...(appUrl ? [`${appUrl}/`] : [])],
      logoutUrls: ['http://localhost:5173/', ...(appUrl ? [`${appUrl}/`] : [])],
    },
  },
  userAttributes: { fullname: { required: false, mutable: true } },
});
