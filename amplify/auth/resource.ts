import { defineAuth } from '@aws-amplify/backend';

// Cuenta con correo y contraseña. El correo se confirma con un código que llega por email,
// y ese mismo código sirve para recuperar la contraseña.
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Tu código de SWAG HUNTERS',
      verificationEmailBody: (createCode) =>
        `Tu código de SWAG HUNTERS es ${createCode()}. Escríbelo en la app para continuar. Si no lo pediste, ignora este correo.`,
    },
  },
  userAttributes: {
    fullname: { required: false, mutable: true }, // el formulario lo pide siempre
    'custom:country': { dataType: 'String', mutable: true, minLen: 2, maxLen: 60 },
  },
});
