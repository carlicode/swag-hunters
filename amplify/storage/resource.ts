import { defineStorage } from '@aws-amplify/backend';

// Fotos de stands y swag. Cada persona escribe solo en su carpeta; todos los usuarios con sesión pueden verlas.
export const storage = defineStorage({
  name: 'swagHuntersPhotos',
  access: (allow) => ({
    'photos/{entity_id}/*': [
      allow.authenticated.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
