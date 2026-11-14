import { companyKey } from './company';
import { blobToDataUrl, compressImage } from './image';
import type { AlertItem, Api, Contest, Swag, SwagReport, User } from './types';

// Modo demo: todo vive en el navegador (localStorage), sin AWS ni Google.
// Sirve para ver el diseño y probar el flujo. Las empresas del ejemplo son ficticias.
const KEY = 'swag-hunters-demo-v1';
const AUTH = 'swag-hunters-demo-auth';
const DEMO_USER: User = { id: 'demo', name: 'Ana R.', email: 'ana@demo.example' };

interface State {
  swags: Swag[];
  reports: SwagReport[];
  contests: Contest[];
  alerts: AlertItem[];
  saved: string[];
}

const uid = () => Math.random().toString(36).slice(2, 10);
const min = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

function seed(): State {
  const mk = (company: string, title: string, howTo: string, reference: string, author: string, ago: number): Swag => ({
    id: uid(),
    company,
    companyKey: companyKey(company),
    title,
    howTo,
    reference,
    authorName: author,
    mine: false,
    createdAt: min(-ago),
  });
  const swags = [
    mk('Nimbus Labs', 'Gorra bordada', 'Escanea tu gafete en el stand y responde 3 preguntas. No piden datos de contacto de tu empresa.', 'Pasillo C, frente al escenario pequeño', 'Luis M.', 12),
    mk('Quark Cloud', 'Termo de acero', 'Haz la demo de 5 minutos con alguien del equipo y te lo dan al terminar.', 'Esquina del Expo, junto a la entrada norte', 'Sofía T.', 70),
    mk('Vector Systems', 'Camiseta edición limitada', 'Fila corta antes de las 10 am. Después de mediodía suele acabarse la talla M y L.', 'Stand 1420, al lado del café', 'Diego P.', 200),
    mk('Nimbus Labs', 'Stickers holográficos', 'Los dan en la mesa de la derecha, sin hacer nada.', 'Pasillo C, mesa de la derecha', 'Marta G.', 25),
    mk('Helix Data', 'Power bank', 'Hay que anotarse en el sorteo y estar presente a la hora del sorteo.', 'Stand 980, segundo piso', 'Sofía T.', 300),
  ];
  const reports: SwagReport[] = [
    { id: uid(), swagId: swags[0].id, kind: 'STILL_THERE', authorName: 'Marta G.', mine: false, createdAt: min(-8) },
    { id: uid(), swagId: swags[0].id, kind: 'TIP', text: 'Pregunta por la gorra negra, la azul ya casi no hay.', authorName: 'Diego P.', mine: false, createdAt: min(-5) },
    { id: uid(), swagId: swags[1].id, kind: 'STILL_THERE', authorName: 'Luis M.', mine: false, createdAt: min(-30) },
    { id: uid(), swagId: swags[4].id, kind: 'GONE', authorName: 'Luis M.', mine: false, createdAt: min(-40) },
  ];
  const mkC = (company: string, title: string, howTo: string, kind: Contest['kind'], start: number, ref: string, author: string): Contest => ({
    id: uid(),
    company,
    companyKey: companyKey(company),
    title,
    howTo,
    kind,
    startsAt: min(start),
    reference: ref,
    authorName: author,
    mine: false,
    createdAt: min(-60),
  });
  const contests = [
    mkC('Helix Data', 'Sorteo de power bank', 'Estar en el stand a la hora exacta. Si no estás, sortean otra vez.', 'TIMED', 25, 'Stand 980, segundo piso', 'Sofía T.'),
    mkC('Quark Cloud', 'Rifa de audífonos', 'Pide un ticket numerado en el mostrador antes de las 3 pm y vuelve al sorteo.', 'TICKET', 130, 'Esquina del Expo, junto a la entrada norte', 'Luis M.'),
    mkC('Nimbus Labs', 'Reto de código en vivo', 'Pasa al stand y resuelve el reto en 10 minutos. Los 3 más rápidos ganan.', 'VISIT', 60 * 26, 'Pasillo C', 'Diego P.'),
  ];
  return { swags, reports, contests, alerts: [], saved: [] };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* sin almacenamiento: se usa el ejemplo en memoria */
  }
  const s = seed();
  save(s);
  return s;
}

function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* cuota llena: los cambios viven solo en esta sesión */
  }
}

let state = load();
const listeners = new Set<() => void>();
const wait = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

async function photo(blob?: Blob): Promise<string | undefined> {
  if (!blob) return undefined;
  return blobToDataUrl(await compressImage(blob, 900, 0.7));
}

export const demoApi: Api = {
  demo: true,

  async getUser() {
    return wait(localStorage.getItem(AUTH) ? DEMO_USER : null, 60);
  },
  async signIn() {
    localStorage.setItem(AUTH, '1');
    listeners.forEach((l) => l());
  },
  async signOut() {
    localStorage.removeItem(AUTH);
    listeners.forEach((l) => l());
  },
  onAuthChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  async listSwags() {
    return wait({ swags: [...state.swags], reports: [...state.reports] });
  },
  async createSwag(input) {
    const swag: Swag = {
      id: uid(),
      company: input.company.trim(),
      companyKey: companyKey(input.company),
      title: input.title.trim(),
      howTo: input.howTo.trim(),
      reference: input.reference?.trim() || undefined,
      photoKey: await photo(input.photo),
      authorName: DEMO_USER.name,
      mine: true,
      createdAt: new Date().toISOString(),
    };
    state = { ...state, swags: [swag, ...state.swags] };
    save(state);
    return swag;
  },
  async addReport(input) {
    const report: SwagReport = {
      id: uid(),
      swagId: input.swagId,
      kind: input.kind,
      text: input.text?.trim() || undefined,
      photoKey: await photo(input.photo),
      authorName: DEMO_USER.name,
      mine: true,
      createdAt: new Date().toISOString(),
    };
    state = { ...state, reports: [...state.reports, report] };
    save(state);
    return report;
  },

  async listContests() {
    return wait([...state.contests]);
  },
  async createContest(input) {
    const c: Contest = {
      id: uid(),
      company: input.company.trim(),
      companyKey: companyKey(input.company),
      title: input.title.trim(),
      howTo: input.howTo.trim(),
      kind: input.kind,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      reference: input.reference?.trim() || undefined,
      photoKey: await photo(input.photo),
      authorName: DEMO_USER.name,
      mine: true,
      createdAt: new Date().toISOString(),
    };
    state = { ...state, contests: [...state.contests, c] };
    save(state);
    return c;
  },

  async listAlerts() {
    return wait([...state.alerts]);
  },
  async createAlert(contest, minutesBefore) {
    const alert: AlertItem = {
      id: uid(),
      contestId: contest.id,
      title: contest.title,
      company: contest.company,
      startsAt: contest.startsAt,
      minutesBefore,
      fireAt: new Date(+new Date(contest.startsAt) - minutesBefore * 60_000).toISOString(),
      sentFlag: 'N',
    };
    state = { ...state, alerts: [...state.alerts.filter((a) => a.contestId !== contest.id), alert] };
    save(state);
    return alert;
  },
  async deleteAlert(id) {
    state = { ...state, alerts: state.alerts.filter((a) => a.id !== id) };
    save(state);
  },

  async listSaved() {
    return wait([...state.saved], 40);
  },
  async setSaved(swagId, saved) {
    const rest = state.saved.filter((id) => id !== swagId);
    state = { ...state, saved: saved ? [...rest, swagId] : rest };
    save(state);
  },

  async flag() {
    /* en demo no se guarda */
  },
  async photoUrl(key) {
    return key; // en demo la clave ya es una URL de datos
  },
};
