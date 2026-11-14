import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sendAlerts } from './functions/send-alerts/resource';

const backend = defineBackend({ auth, data, storage, sendAlerts });

// La función que envía las alertas necesita permiso para mandar correos con SES.
backend.sendAlerts.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  }),
);
