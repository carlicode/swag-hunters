import { companyKey } from './company';
import { blobToDataUrl, compressImage } from './image';
import type { AlertItem, Api, Contest, Swag, SwagReport, User } from './types';

// Modo demo: todo vive en el navegador (localStorage), sin AWS ni Google.
// Sirve para ver el diseño y probar el flujo. Las empresas del ejemplo son ficticias.
const KEY = 'swag-hunters-demo-v3'; // v2: datos de ejemplo con fotos
const AUTH = 'swag-hunters-demo-auth';
const DEMO_USER: User = { id: 'demo', name: 'Ana R.', email: 'ana@demo.example', country: 'Bolivia' };

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
    mk('s1', 'Nimbus Labs', 'Cream tote bag', 'Scan your badge at the booth and take one. They don\'t ask for company details.', 'Aisle C, in front of the small stage', 'tote', 'Luis M.', 14),
    mk('s2', 'Quark Cloud', 'Black thermos', 'Do the 5-minute demo with someone from the team and they give it to you at the end.', 'Expo corner, north entrance', 'termo', 'Sofia T.', 40),
    mk('s4', 'Helix Data', 'White backpack', 'Sign up for the raffle at the booth and come back at exactly 3 pm.', 'Booth 980, second floor', 'mochila', 'Marta G.', 35),
    mk('s6', 'Nimbus Labs', 'Holographic stickers', 'They are on the table on the right, no strings attached.', 'Aisle C, table on the right', undefined, 'Marta G.', 50),
    mk('s5', 'Pixel Forge', '#swag cap', 'Answer 3 questions at the booth and it is yours.', 'Table next to the entrance', 'gorra', 'Luis M.', 75),
    mk('s3', 'Vector Systems', 'Limited edition green polo', 'Short line before 10 am. After that sizes M and L run out.', 'Booth 1420, next to the coffee stand', 'polo', 'Diego P.', 190),
  ];
  const rp = (id: string, swagId: string, kind: SwagReport['kind'], author: string, ago: number, text?: string): SwagReport => ({
    id, swagId, kind, text, authorName: author, mine: false, createdAt: min(-ago),
  });
  const reports: SwagReport[] = [
    rp('r1', 's1', 'STILL_THERE', 'Marta G.', 3),
    rp('r2', 's2', 'STILL_THERE', 'Luis M.', 12),
    rp('r3', 's4', 'STILL_THERE', 'Marta G.', 30),
    rp('r4', 's4', 'TIP', 'Sofia T.', 26, 'Only people who sign up before 3 pm can join. Get there early.'),
    rp('r5', 's4', 'STILL_THERE', 'Diego P.', 20),
    rp('r6', 's6', 'STILL_THERE', 'Luis M.', 40),
    rp('r7', 's5', 'STILL_THERE', 'Sofia T.', 60),
    rp('r8', 's3', 'GONE', 'Luis M.', 80),
    rp('r9', 's3', 'GONE', 'Sofia T.', 70),
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
    mkC('c1', 'Helix Data', 'Backpack raffle', 'Be at the booth at the exact time. If you are not there, they draw again.', 'TIMED', 25, 'Booth 980, second floor', 'Sofia T.'),
    mkC('c4', 'Nimbus Labs', 'Demo + tote bag', 'Stop by the booth, watch the demo and scan your badge.', 'VISIT', 4 * 60, 'Aisle C', 'Luis M.'),
    mkC('c2', 'Quark Cloud', 'Thermos raffle', 'Get a number at the counter before 8 pm and come back for the draw.', 'TICKET', 6 * 60, 'Expo corner, north entrance', 'Marta G.'),
    mkC('c3', 'Pixel Forge', '#swag cap challenge', 'Solve the challenge in 10 minutes. The 3 fastest win.', 'VISIT', 26 * 60, 'Table next to the entrance', 'Diego P.'),
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
  // En la demo cualquier correo y contraseña sirven, y el código de confirmación es 123456.
  async signIn() {
    localStorage.setItem(AUTH, '1');
    listeners.forEach((l) => l());
    return 'done';
  },
  async signUp() {
    await wait(null, 300);
  },
  async confirmSignUp(_email, code) {
    await wait(null, 300);
    if (code.trim() !== '123456') throw Object.assign(new Error('wrong code'), { name: 'CodeMismatchException' });
  },
  async resendCode() {
    await wait(null, 200);
  },
  async forgotPassword() {
    await wait(null, 300);
  },
  async resetPassword(_email, code) {
    await wait(null, 300);
    if (code.trim() !== '123456') throw Object.assign(new Error('wrong code'), { name: 'CodeMismatchException' });
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
