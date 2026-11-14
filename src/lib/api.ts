import { amplifyApi, outputs } from './amplify';
import { demoApi } from './demo';
import type { Api } from './types';

// Con backend desplegado (amplify_outputs.json) usa AWS. Sin backend, o con VITE_DEMO=1, usa el modo demo.
export const api: Api = outputs && import.meta.env.VITE_DEMO !== '1' ? amplifyApi : demoApi;
