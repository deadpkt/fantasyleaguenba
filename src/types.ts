// /api/data-ის პასუხის ფორმა (api/_lib/site_data.py აწყობს)

export interface Standing {
  name: string;
  w: number;
  l: number;
  pf: number;
}

export interface DraftInfo {
  /** დრაფტის დაწყება, ms (UTC) */
  date: number | null;
  type: string | null;
  pick_seconds: number | null;
}

export interface CurrentSeason {
  label: string;
  week: number;
  drafted: boolean;
  standings: Standing[];
  draft: DraftInfo | null;
}

export interface Champion {
  season: string;
  team: string;
  rec: string;
  runner: string | null;
}

export interface CareerSeason {
  season: string;
  team: string;
  rec: string;
  final: number;
  complete: boolean;
}

export interface AllTimeRow {
  team: string;
  w: number;
  l: number;
  t: number;
  pct: number;
  ppg: number;
  pf: number;
  titles: number;
  titles_y: string[];
  finals: number;
  playoffs: number;
  seasons: number;
  best_week: number;
  ovr: number;
  history: CareerSeason[];
}

export interface RecordItem {
  k: string;
  v: string;
  who: string;
  when: string;
}

export interface SeasonStanding extends Standing {
  pa: number;
  final: number;
  seed: number;
  acq: number;
  trades: number;
}

export interface TeamValue {
  team: string;
  v: number;
}

export interface Awards {
  mvp: { player: string; total: number; avg: number; pid: number } | null;
  pf: TeamValue;
  pa: TeamValue;
  acq: TeamValue;
  trades: TeamValue;
  best_week: (TeamValue & { p: number }) | null;
}

/** [ქულა, 1 = მოგება / 0 = წაგება / 2 = ფრე] ან null, თუ ამ კვირას არ ეთამაშა */
export type WeekCell = [number, 0 | 1 | 2] | null;

export interface Weekly {
  weeks: number[];
  teams: { name: string; scores: WeekCell[] }[];
}

export interface LuckRow {
  name: string;
  real: number;
  allplay: number;
  luck: number;
}

export interface PowerRow {
  name: string;
  score: number;
  rec: string;
  ppg: number;
}

export interface DraftPick {
  player: string;
  pid: number;
  n: number;
  rank: number;
  total: number;
  team: string;
}

export interface DraftReview {
  steals: DraftPick[];
  busts: DraftPick[];
  grades: { team: string; grade: string; best: string }[];
  round1: DraftPick[];
}

export interface Season {
  label: string;
  complete: boolean;
  standings: SeasonStanding[];
  awards: Awards;
  weekly: Weekly;
  luck: LuckRow[];
  power: PowerRow[];
  draft: DraftReview | null;
}

export interface LeagueData {
  league: string;
  updated: string;
  current: CurrentSeason;
  champions: Champion[];
  alltime: AllTimeRow[];
  records: RecordItem[];
  seasons: Season[];
  h2h: { teams: string[]; cells: [number, number][][] };
  /** გუნდის სახელი → ლოგოს URL */
  logos: Record<string, string>;
  /** გუნდის სახელი → NBA გუნდის კოდი (fans.json) */
  fans: Record<string, string>;
  managers: Manager[];
}

export interface Manager {
  team: string;
  abbrev: string;
  logo: string | null;
  fan: string | null;
  rookie: boolean;
  ovr: number | null;
  w: number;
  l: number;
  titles: number;
  best_week: number;
  ppg: number;
  playoffs: number;
  seasons: { season: string; team: string; rec: string; champ: boolean }[];
}
