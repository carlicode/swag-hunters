import { Amplify } from 'aws-amplify';
import {
  confirmResetPassword,
  confirmSignUp as cognitoConfirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn as cognitoSignIn,
  signOut,
  signUp as cognitoSignUp,
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { Hub } from 'aws-amplify/utils';
import { getUrl, uploadData } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import { companyKey } from './company';
import { compressImage } from './image';
import type { AlertItem, Api, Contest, ContestKind, ReportKind, Swag, SwagReport, User } from './types';

// amplify_outputs.json lo genera `npx ampx sandbox` o el despliegue. Si no existe, la app corre en modo demo.
const found = import.meta.glob('../../amplify_outputs.json', { eager: true, import: 'default' });
export const outputs = Object.values(found)[0] as Record<string, unknown> | undefined;

const norm = (email: string) => email.trim().toLowerCase();

let client: ReturnType<typeof generateClient<Schema>>;
let me: User | null = null;

if (outputs) {
  Amplify.configure(outputs);
  client = generateClient<Schema>({ authMode: 'userPool' });
}

/** "Carla Florida" -> "Carla F." Mostramos solo nombre y la inicial del apellido. */
function shortName(full?: string, fallbackEmail?: string): string {
  const base = (full || fallbackEmail?.split('@')[0] || 'Anónimo').trim();
  const [first, ...rest] = base.split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first;
}

async function currentUser(): Promise<User | null> {
  try {
    const u = await getCurrentUser();
    const attrs = await fetchUserAttributes();
    const country = (attrs as Record<string, string | undefined>)['custom:country'];
    me = { id: u.userId, name: shortName(attrs.name, attrs.email), email: attrs.email ?? '', country };
  } catch {
    me = null;
  }
  return me;
}

async function listAll<T>(fetchPage: (nextToken?: string | null) => Promise<{ data: T[]; nextToken?: string | null }>) {
  const out: T[] = [];
  let token: string | null | undefined;
  do {
    const page = await fetchPage(token);
    out.push(...page.data);
    token = page.nextToken;
  } while (token);
  return out;
}

async function upload(blob?: Blob): Promise<string | undefined> {
  if (!blob) return undefined;
  const small = await compressImage(blob);
  const id = crypto.randomUUID();
  const { path } = await uploadData({
    path: ({ identityId }) => `photos/${identityId}/${id}.jpg`,
    data: small,
    options: { contentType: 'image/jpeg' },
  }).result;
  return path;
}

// Cognito guarda el dueño como "sub::usuario"; el tipo generado no lo expone, por eso el cast.
const owns = (row: unknown, user: User | null) => {
  const owner = (row as { owner?: string | null }).owner;
  return !!user && !!owner && owner.startsWith(user.id);
};

const urlCache = new Map<string, { url: string; at: number }>();

export const amplifyApi: Api = {
  demo: false,

  getUser: currentUser,
  async signIn(email, password) {
    try {
      const r = await cognitoSignIn({ username: norm(email), password });
      return r.nextStep.signInStep === 'CONFIRM_SIGN_UP' ? 'confirm' : 'done';
    } catch (e) {
      if ((e as { name?: string }).name === 'UserAlreadyAuthenticatedException') return 'done';
      throw e;
    }
  },
  async signUp({ name, country, email, password }) {
    await cognitoSignUp({
      username: norm(email),
      password,
      options: { userAttributes: { email: norm(email), name: name.trim(), 'custom:country': country } },
    });
  },
  async confirmSignUp(email, code) {
    await cognitoConfirmSignUp({ username: norm(email), confirmationCode: code.trim() });
  },
  async resendCode(email) {
    await resendSignUpCode({ username: norm(email) });
  },
  async forgotPassword(email) {
    await resetPassword({ username: norm(email) });
  },
  async resetPassword(email, code, newPassword) {
    await confirmResetPassword({ username: norm(email), confirmationCode: code.trim(), newPassword });
  },
  signOut: () => signOut(),
  onAuthChange(cb) {
    return Hub.listen('auth', cb);
  },

  async listSwags() {
    const user = me ?? (await currentUser());
    const [swags, reports] = await Promise.all([
      listAll((t) => client.models.Swag.list({ limit: 1000, nextToken: t })),
      listAll((t) => client.models.SwagReport.list({ limit: 1000, nextToken: t })),
    ]);
    return {
      swags: swags.map<Swag>((s) => ({
        id: s.id,
        company: s.company,
        companyKey: s.companyKey,
        title: s.title,
        howTo: s.howTo,
        reference: s.reference ?? undefined,
        photoKey: s.photoKey ?? undefined,
        authorName: s.authorName,
        mine: owns(s, user),
        createdAt: s.createdAt,
      })),
      reports: reports.map<SwagReport>((r) => ({
        id: r.id,
        swagId: r.swagId,
        kind: (r.kind ?? 'TIP') as ReportKind,
        text: r.text ?? undefined,
        photoKey: r.photoKey ?? undefined,
        authorName: r.authorName,
        mine: owns(r, user),
        createdAt: r.createdAt,
      })),
    };
  },

  async createSwag(input) {
    const user = me ?? (await currentUser());
    const photoKey = await upload(input.photo);
    const { data, errors } = await client.models.Swag.create({
      company: input.company.trim(),
      companyKey: companyKey(input.company),
      title: input.title.trim(),
      howTo: input.howTo.trim(),
      reference: input.reference?.trim() || undefined,
      photoKey,
      authorName: user?.name ?? 'Anónimo',
    });
    if (!data) throw new Error(errors?.[0]?.message ?? 'No se pudo guardar');
    return {
      id: data.id,
      company: data.company,
      companyKey: data.companyKey,
      title: data.title,
      howTo: data.howTo,
      reference: data.reference ?? undefined,
      photoKey: data.photoKey ?? undefined,
      authorName: data.authorName,
      mine: true,
      createdAt: data.createdAt,
    };
  },

  async addReport(input) {
    const user = me ?? (await currentUser());
    const photoKey = await upload(input.photo);
    const { data, errors } = await client.models.SwagReport.create({
      swagId: input.swagId,
      kind: input.kind,
      text: input.text?.trim() || undefined,
      photoKey,
      authorName: user?.name ?? 'Anónimo',
    });
    if (!data) throw new Error(errors?.[0]?.message ?? 'No se pudo guardar');
    return {
      id: data.id,
      swagId: data.swagId,
      kind: (data.kind ?? 'TIP') as ReportKind,
      text: data.text ?? undefined,
      photoKey: data.photoKey ?? undefined,
      authorName: data.authorName,
      mine: true,
      createdAt: data.createdAt,
    };
  },

  async listContests() {
    const user = me ?? (await currentUser());
    const rows = await listAll((t) => client.models.Contest.list({ limit: 1000, nextToken: t }));
    return rows.map<Contest>((c) => ({
      id: c.id,
      company: c.company,
      companyKey: c.companyKey,
      title: c.title,
      howTo: c.howTo,
      kind: (c.kind ?? 'VISIT') as ContestKind,
      startsAt: c.startsAt,
      endsAt: c.endsAt ?? undefined,
      reference: c.reference ?? undefined,
      photoKey: c.photoKey ?? undefined,
      authorName: c.authorName,
      mine: owns(c, user),
      createdAt: c.createdAt,
    }));
  },

  async createContest(input) {
    const user = me ?? (await currentUser());
    const photoKey = await upload(input.photo);
    const { data, errors } = await client.models.Contest.create({
      company: input.company.trim(),
      companyKey: companyKey(input.company),
      title: input.title.trim(),
      howTo: input.howTo.trim(),
      kind: input.kind,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      reference: input.reference?.trim() || undefined,
      photoKey,
      authorName: user?.name ?? 'Anónimo',
    });
    if (!data) throw new Error(errors?.[0]?.message ?? 'No se pudo guardar');
    return {
      id: data.id,
      company: data.company,
      companyKey: data.companyKey,
      title: data.title,
      howTo: data.howTo,
      kind: (data.kind ?? 'VISIT') as ContestKind,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? undefined,
      reference: data.reference ?? undefined,
      photoKey: data.photoKey ?? undefined,
      authorName: data.authorName,
      mine: true,
      createdAt: data.createdAt,
    };
  },

  async listAlerts() {
    const rows = await listAll((t) => client.models.Alert.list({ limit: 1000, nextToken: t }));
    return rows.map<AlertItem>((a) => ({
      id: a.id,
      contestId: a.contestId,
      title: a.title,
      company: a.company,
      startsAt: a.startsAt,
      minutesBefore: a.minutesBefore,
      fireAt: a.fireAt,
      sentFlag: a.sentFlag as AlertItem['sentFlag'],
    }));
  },

  async createAlert(contest, minutesBefore) {
    const user = me ?? (await currentUser());
    if (!user?.email) throw new Error('Tu cuenta no tiene correo');
    // Una sola alerta por concurso: reemplaza la anterior si existe.
    const existing = await client.models.Alert.list({ filter: { contestId: { eq: contest.id } } });
    await Promise.all(existing.data.map((a) => client.models.Alert.delete({ id: a.id })));
    const fireAt = new Date(+new Date(contest.startsAt) - minutesBefore * 60_000).toISOString();
    const { data, errors } = await client.models.Alert.create({
      contestId: contest.id,
      title: contest.title,
      company: contest.company,
      startsAt: contest.startsAt,
      minutesBefore,
      fireAt,
      email: user.email,
      sentFlag: 'N',
    });
    if (!data) throw new Error(errors?.[0]?.message ?? 'No se pudo crear la alerta');
    return { id: data.id, contestId: contest.id, title: contest.title, company: contest.company, startsAt: contest.startsAt, minutesBefore, fireAt, sentFlag: 'N' };
  },

  async deleteAlert(id) {
    await client.models.Alert.delete({ id });
  },

  async listSaved() {
    const rows = await listAll((t) => client.models.Saved.list({ limit: 1000, nextToken: t }));
    return rows.map((r) => r.swagId);
  },

  async setSaved(swagId, saved) {
    const rows = await client.models.Saved.list({ filter: { swagId: { eq: swagId } } });
    if (saved && rows.data.length === 0) await client.models.Saved.create({ swagId });
    if (!saved) await Promise.all(rows.data.map((r) => client.models.Saved.delete({ id: r.id })));
  },

  async flag(targetType, targetId, reason) {
    await client.models.Flag.create({ targetType, targetId, reason });
  },

  async photoUrl(key) {
    const cached = urlCache.get(key);
    if (cached && Date.now() - cached.at < 40 * 60_000) return cached.url;
    await fetchAuthSession();
    const { url } = await getUrl({ path: key, options: { expiresIn: 3600 } });
    urlCache.set(key, { url: url.toString(), at: Date.now() });
    return url.toString();
  },
};
