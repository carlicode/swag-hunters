import { companyKey } from './company';
import { blobToDataUrl, compressImage } from './image';
import type { AlertItem, Api, Contest, Swag, SwagReport, User } from './types';

// Modo demo: todo vive en el navegador (localStorage), sin AWS ni Google.
// Sirve para ver el diseño y probar el flujo. Las empresas del ejemplo son ficticias.
const KEY = 'swag-hunters-demo-v2'; // v2: datos de ejemplo con fotos
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
  // Las fotos viven en public/demo/ y no se suben a GitHub (son de terceros). Si faltan, la app muestra el arte de reemplazo.
  const mk = (id: string, company: string, title: string, howTo: string, reference: string, photo: string | undefined, author: string, ago: number): Swag => ({
    id,
    company,
    companyKey: companyKey(company),
    title,
    howTo,
    reference,
    photoKey: photo ? `/demo/${photo}.jpg` : undefined,
    authorName: author,
    mine: false,
    createdAt: min(-ago),
  });
  const swags = [
    mk('s1', 'Nimbus Labs', 'Tote bag crema', 'Escanea tu gafete en el stand y llévate una. No piden datos de tu empresa.', 'Pasillo C, frente al escenario pequeño', 'tote', 'Luis M.', 14),
    mk('s2', 'Quark Cloud', 'Termo negro', 'Haz la demo de 5 minutos con alguien del equipo y te lo dan al terminar.', 'Esquina del Expo, entrada norte', 'termo', 'Sofía T.', 40),
    mk('s4', 'Helix Data', 'Mochila blanca', 'Anótate al sorteo en el stand y vuelve a las 3 pm a la hora exacta.', 'Stand 980, segundo piso', 'mochila', 'Marta G.', 35),
    mk('s6', 'Nimbus Labs', 'Stickers holográficos', 'Están en la mesa de la derecha, sin hacer nada.', 'Pasillo C, mesa de la derecha', undefined, 'Marta G.', 50),
    mk('s5', 'Pixel Forge', 'Gorra #swag', 'Responde 3 preguntas en el stand y te la llevas.', 'Mesa junto a la entrada', 'gorra', 'Luis M.', 75),
    mk('s3', 'Vector Systems', 'Polo verde edición limitada', 'Fila corta antes de las 10 am. Después se acaban las tallas M y L.', 'Stand 1420, al lado del café', 'polo', 'Diego P.', 190),
  ];
  const rp = (id: string, swagId: string, kind: SwagReport['kind'], author: string, ago: number, text?: string): SwagReport => ({
    id, swagId, kind, text, authorName: author, mine: false, createdAt: min(-ago),
  });
  const reports: SwagReport[] = [
    rp('r1', 's1', 'STILL_THERE', 'Marta G.', 3),
    rp('r2', 's2', 'STILL_THERE', 'Luis M.', 12),
    rp('r3', 's4', 'STILL_THERE', 'Marta G.', 30),
    rp('r4', 's4', 'TIP', 'Sofía T.', 26, 'Solo participan quienes se anotan antes de las 3 pm. Llega temprano.'),
    rp('r5', 's4', 'STILL_THERE', 'Diego P.', 20),
    rp('r6', 's6', 'STILL_THERE', 'Luis M.', 40),
    rp('r7', 's5', 'STILL_THERE', 'Sofía T.', 60),
    rp('r8', 's3', 'GONE', 'Luis M.', 80),
    rp('r9', 's3', 'GONE', 'Sofía T.', 70),
  ];
  const mkC = (id: string, company: string, title: string, howTo: string, kind: Contest['kind'], start: number, ref: string, author: string): Contest => ({
    id,
    company,
    companyKey: companyKey(company),
    title,
    howTo,
    kind,
    startsAt: min(start),
    reference: ref,
    authorName: author,
    mine: false,
    createdAt: min(-90),
  });
  const contests = [
    mkC('c1', 'Helix Data', 'Sorteo de mochila', 'Estar en el stand a la hora exacta. Si no estás, sortean otra vez.', 'TIMED', 25, 'Stand 980, segundo piso', 'Sofía T.'),
    mkC('c4', 'Nimbus Labs', 'Demo + tote bag', 'Pasa por el stand, mira la demo y escanea tu gafete.', 'VISIT', 4 * 60, 'Pasillo C', 'Luis M.'),
    mkC('c2', 'Quark Cloud', 'Rifa de termos', 'Pide un número en el mostrador antes de las 8 pm y vuelve al sorteo.', 'TICKET', 6 * 60, 'Esquina del Expo, entrada norte', 'Marta G.'),
    mkC('c3', 'Pixel Forge', 'Reto de gorra #swag', 'Resuelve el reto en 10 minutos. Ganan los 3 más rápidos.', 'VISIT', 26 * 60, 'Mesa junto a la entrada', 'Diego P.'),
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
