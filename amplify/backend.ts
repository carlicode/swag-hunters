import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sendAlerts } from './functions/send-alerts/resource';

const backend = defineBackend({ auth, data, storage, sendAlerts });

// Contraseña más amable: mínimo 8 caracteres con letras y números (sin exigir mayúsculas ni símbolos).
backend.auth.resources.cfnResources.cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: true,
    requireUppercase: false,
    requireNumbers: true,
    requireSymbols: false,
  },
};

// La función que envía las alertas necesita permiso para mandar correos con SES.
backend.sendAlerts.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  }),
);
