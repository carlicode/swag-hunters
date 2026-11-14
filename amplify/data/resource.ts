import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { sendAlerts } from '../functions/send-alerts/resource';

// Todos los usuarios con sesión leen. Cada persona edita solo lo suyo.
const readAll = (allow: any) => [allow.authenticated().to(['read']), allow.owner()];

const schema = a.schema({
  // Un swag de una empresa (ej. "Gorra negra"). Las confirmaciones y tips van en SwagReport.
  Swag: a
    .model({
      company: a.string().required(),
      companyKey: a.string().required(), // nombre normalizado para agrupar "Datadog" y "datadog inc"
      title: a.string().required(),
      howTo: a.string().required(), // qué hay que hacer para conseguirlo
      reference: a.string(), // referencia del stand: "frente al escenario"
      photoKey: a.string(),
      authorName: a.string().required(),
      reports: a.hasMany('SwagReport', 'swagId'),
    })
    .authorization(readAll),

  // Aportes de otras personas: sigue disponible, se acabó, un tip o una foto nueva.
  SwagReport: a
    .model({
      swagId: a.id().required(),
      swag: a.belongsTo('Swag', 'swagId'),
      kind: a.enum(['STILL_THERE', 'GONE', 'TIP', 'PHOTO']),
      text: a.string(),
      photoKey: a.string(),
      authorName: a.string().required(),
    })
    .authorization(readAll),

  // Concursos y sorteos con hora: ir al stand, pedir un ticket o estar a cierta hora.
  Contest: a
    .model({
      company: a.string().required(),
      companyKey: a.string().required(),
      title: a.string().required(),
      howTo: a.string().required(),
      kind: a.enum(['VISIT', 'TICKET', 'TIMED']),
      startsAt: a.datetime().required(),
      endsAt: a.datetime(),
      reference: a.string(),
      photoKey: a.string(),
      authorName: a.string().required(),
    })
    .authorization(readAll),

  // Alerta por correo unos minutos antes de un concurso. Solo la ve quien la creó y la función que envía.
  Alert: a
    .model({
      contestId: a.id().required(),
      title: a.string().required(),
      company: a.string().required(),
      startsAt: a.datetime().required(),
      minutesBefore: a.integer().required(),
      fireAt: a.datetime().required(),
      email: a.string().required(),
      sentFlag: a.string().required(), // N = pendiente, Y = enviada, X = vencida
    })
    .secondaryIndexes((index) => [index('sentFlag').sortKeys(['fireAt'])])
    .authorization((allow) => [allow.owner()]),

  // Swags que guardaste al deslizar a la derecha.
  Saved: a
    .model({ swagId: a.id().required() })
    .authorization((allow) => [allow.owner()]),

  // Reportes de contenido inapropiado. Se revisan desde la consola de AWS.
  Flag: a
    .model({
      targetType: a.string().required(),
      targetId: a.id().required(),
      reason: a.string(),
    })
    .authorization((allow) => [allow.owner().to(['create', 'read'])]),
})
  // La función programada que envía las alertas necesita leer y actualizar la tabla Alert.
  .authorization((allow) => [allow.resource(sendAlerts).to(['query', 'mutate'])]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});
