export type ReportKind = 'STILL_THERE' | 'GONE' | 'TIP' | 'PHOTO';
export type ContestKind = 'VISIT' | 'TICKET' | 'TIMED';

export interface User {
  id: string;
  name: string; // "Carla F."
  email: string;
  country?: string;
}

export interface Swag {
  id: string;
  company: string;
  companyKey: string;
  title: string;
  howTo: string;
  reference?: string;
  photoKey?: string;
  authorName: string;
  mine: boolean;
  createdAt: string;
}

export interface SwagReport {
  id: string;
  swagId: string;
  kind: ReportKind;
  text?: string;
  photoKey?: string;
  authorName: string;
  mine: boolean;
  createdAt: string;
}

export interface Contest {
  id: string;
  company: string;
  companyKey: string;
  title: string;
  howTo: string;
  kind: ContestKind;
  startsAt: string;
  endsAt?: string;
  reference?: string;
  photoKey?: string;
  authorName: string;
  mine: boolean;
  createdAt: string;
}

export interface AlertItem {
  id: string;
  contestId: string;
  title: string;
  company: string;
  startsAt: string;
  minutesBefore: number;
  fireAt: string;
  sentFlag: 'N' | 'Y' | 'X';
}

export type NewSwag = Pick<Swag, 'company' | 'title' | 'howTo' | 'reference'> & { photo?: Blob };
export type NewReport = { swagId: string; kind: ReportKind; text?: string; photo?: Blob };
export type NewContest = Pick<Contest, 'company' | 'title' | 'howTo' | 'kind' | 'startsAt' | 'endsAt' | 'reference'> & {
  photo?: Blob;
};

export interface Api {
  readonly demo: boolean;
  getUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<'done' | 'confirm'>;
  signUp(input: { name: string; country: string; email: string; password: string }): Promise<void>;
  confirmSignUp(email: string, code: string): Promise<void>;
  resendCode(email: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, code: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(cb: () => void): () => void;

  listSwags(): Promise<{ swags: Swag[]; reports: SwagReport[] }>;
  createSwag(input: NewSwag): Promise<Swag>;
  addReport(input: NewReport): Promise<SwagReport>;

  listContests(): Promise<Contest[]>;
  createContest(input: NewContest): Promise<Contest>;

  listAlerts(): Promise<AlertItem[]>;
  createAlert(contest: Contest, minutesBefore: number): Promise<AlertItem>;
  deleteAlert(id: string): Promise<void>;

  listSaved(): Promise<string[]>;
  setSaved(swagId: string, saved: boolean): Promise<void>;

  flag(targetType: 'SWAG' | 'CONTEST' | 'REPORT', targetId: string, reason?: string): Promise<void>;
  photoUrl(key: string): Promise<string>;
}
