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
  /** რეგულარული სეზონის კალენდარი (პლეიოფის შანსებისთვის) */
  schedule: SchedGame[];
  /** ESPN-ის Standings: სრული ცხრილი და გუნდების სეზონის სტატისტიკა */
  table?: TableRow[];
}

export interface TableRow {
  tid: number;
  name: string;
  abbrev: string;
  seed: number;
  w: number;
  l: number;
  t: number;
  pct: number;
  gb: number;
  pf: number;
  pa: number;
  streak: string;
  /** x = პლეიოფში გავიდა, y = დივიზიონი, z = პირველი რაუნდი თავისუფალი, e = გავარდა */
  clinch: string;
  acq: number;
  drops: number;
  trades: number;
  moves: number;
  proj_rank: number | null;
  stats: Record<string, number>;
  /** ESPN-ის ტრეიდის ბლოკი: გასაყიდად გამოტანილი და ხელშეუხებელი მოთამაშეები (pid) */
  on_block?: number[];
  untouchable?: number[];
}

export interface SchedGame {
  p: number;
  h: string;
  a: string;
  hs: number;
  as: number;
  done: boolean;
}

export interface PlayedGame {
  p: number;
  h: string;
  a: string;
  hs: number;
  as: number;
  po: boolean;
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
  games: PlayedGame[];
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
  waivers: WaiverPlayer[];
  updated_at?: string;
  projections: Projections | null;
  current_draft: CurrentDraftPick[];
  settings: LeagueSettings | null;
  trades?: Trades;
  /** ESPN-ის აქტივობა: აყვანა, გაშვება, ტრეიდი (უახლესი პირველი) */
  activity?: LeagueActivity[];
}

export interface LeagueActivity {
  id: string;
  kind: "add" | "waiver" | "drop" | "trade" | "trade_review";
  date: string;
  team?: string;
  tid?: number;
  added?: { name: string; pid: number }[];
  dropped?: { name: string; pid: number }[];
  sides?: TradeSide[];
}

export interface CurrentDraftPick {
  n: number;
  round: number;
  pick: number;
  pid: number;
  player: string;
  team: string;
  projected: number;
}

export interface RosterPlayer {
  name: string;
  pid: number;
  pos: string | null;
  pro: string | null;
  avg: number;
  /** მიმდინარე სეზონის ESPN projected fantasy points */
  projected: number;
  /** ESPN 2026–27 projection calculated with the league's custom scoring. */
  projected_avg: number;
  /** ამ სეზონში ნათამაშები */
  gp: number;
  /** სეზონის ჯამური ფანტაზი ქულა */
  total?: number;
  /** სეზონის საშუალოები თამაშზე: PTS, REB, AST, STL, BLK, 3PM, TO, MIN, FG%, FT% */
  season_line?: Record<string, number> | null;
  /** მოსალოდნელი ქულა თამაშზე (ფაქტობრივი + ESPN projection) */
  per_game: number;
  /** თამაშები ამ კვირაში / დარჩენილი / მოსალოდნელი ქულა კვირის ბოლომდე */
  week_games?: number;
  week_left: number;
  week_expected: number;
  /** დარჩენილი თამაშები სეზონში */
  ros_games: number;
  slot?: string | null;
  injury: string | null;
}

export interface Manager {
  tid: number;
  roster: RosterPlayer[];
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
  season_acquisitions: number;
  season_trades: number;
  seasons: { season: string; team: string; rec: string; champ: boolean }[];
}

export interface WaiverPlayer extends RosterPlayer {
  projected_avg: number;
}

export interface LeagueSettings {
  scoring_type: string | null;
  scoring: { abbr: string; label: string; points: number }[];
  examples: { label: string; points: number }[];
  roster: { slot: string; count: number }[];
  teams: number;
  regular_season_weeks: number | null;
  playoff_teams: number | null;
  playoff_round_weeks: number | null;
  trade_deadline: number | null;
  veto_votes: number | null;
  waiver_hours: number | null;
  acquisition_limit: number | null;
  acquisition_type: string | null;
  draft_type: string | null;
  pick_seconds: number | null;
}

export interface Announcement {
  reactions?: Record<string, number>;
  id?: string;
  created?: string;
  date?: string;
  title: string;
  text?: string;
  image?: string;
  pinned?: boolean;
  auto?: boolean;
}

export interface NbaArticle {
  headline: string;
  description?: string;
  published?: string;
  image?: string | null;
  link?: string | null;
}

export interface PlayerNews {
  pid: number;
  player?: string | null;
  owner?: string | null;
  headline: string;
  story?: string;
  published?: string;
  source?: string;
}

export interface Injury {
  player: string;
  pid: number | null;
  team: string;
  status: string;
  comment?: string;
  date?: string;
  owner?: string | null;
}

export interface NewsData {
  updated: string;
  announcements: Announcement[];
  nba: NbaArticle[];
  fantasy: PlayerNews[];
  injuries: Injury[];
}

/** სტატისტიკის ხაზი (დღის ან კვირის) */
export type StatLine = Record<"PTS" | "REB" | "AST" | "STL" | "BLK" | "TO" | "3PM" | "FGM" | "FGA" | "FTM" | "FTA" | "MIN", number>;

export interface LivePlayer {
  name: string;
  pid: number;
  slot: string;
  pro: string;
  opp: string | null;
  /** ქულა მთელ კვირაში */
  points: number;
  played: boolean;
  injury: string | null;
  /** დღევანდელი თამაში: none (არ აქვს), upcoming, live, final */
  status: "none" | "upcoming" | "live" | "final";
  /** დღევანდელი თამაშის დაწყება (ISO) */
  tip: string | null;
  today: number;
  today_line: StatLine | null;
  week_line: StatLine | null;
  per_game: number;
  week_left: number;
  week_games: number;
  /** კვირის განრიგი: დღე (scoringPeriodId) → [მეტოქე, დაწყება ISO] */
  games?: Record<string, [string | null, string | null]>;
}

/** /api/player: მოთამაშის გვერდი */
export interface PlayerCard {
  pid: number;
  name: string;
  pro: string | null;
  pos: string | null;
  injury: string | null;
  return: string | null;
  owner: { tid: number; team: string; slot: string | null } | null;
  season: {
    label: string;
    gp: number;
    total: number;
    avg: number;
    projected_avg: number;
    per_game: number;
    line: Record<string, number> | null;
  };
  last_season: { season: string; total: number; avg: number; gp: number; line?: Record<string, number> | null } | null;
  jersey: string | null;
  pos_rank: number | null;
  /** რამდენ % ESPN ლიგაში ჰყავთ */
  owned: number | null;
  /** საშუალო დრაფტის პიკი ESPN-ზე */
  adp: number | null;
  outlook: string | null;
  news: { date: string | null; headline: string; story: string }[];
  projection: { avg: number; total: number; line: Record<string, number> | null } | null;
  games: { sp: number; date: string | null; opp: string | null; fpts: number; line: StatLine }[];
  upcoming: { sp: number; date: string | null; opp: string | null }[];
  drafts: { season: string; team: string; round: number; pick: number; n: number; total: number | null; avg: number | null; rank: number | null }[];
  updated: string;
}

export interface LiveDay {
  sp: number;
  /** ამერიკული დღე (YYYY-MM-DD) */
  date: string | null;
  today: boolean;
  past: boolean;
}

export interface LiveTeam {
  tid: number | null;
  name: string;
  score: number;
  /** დღევანდელი ქულა (სასტარტოები) */
  today: number;
  /** ჩვენი პროგნოზი კვირის ბოლოსთვის (მოთამაშეებით) */
  projected: number | null;
  espn_projected: number | null;
  remaining: number | null;
  games_left: number | null;
  sd: number | null;
  /** მოგების შანსი 0–1 */
  win: number | null;
  starters: LivePlayer[];
  bench: LivePlayer[];
  /** ამ კვირაში ითამაშა გუნდისთვის, მერე წავიდა (ტრეიდი/გაშვება): ქულა გუნდს რჩება */
  departed?: { name: string; pid: number; points: number }[];
}

export interface LiveData {
  period: number;
  today: number;
  is_points: boolean;
  drafted: boolean;
  updated: string;
  days?: LiveDay[];
  matchups: { home: LiveTeam; away: LiveTeam }[];
}

export interface TradeSide {
  team: string;
  to: string | null;
  gives: { name: string; pid: number | null }[];
}

export interface Trades {
  /** pending: ESPN-ზე განხილვაშია, მოთამაშეები ჯერ არ გადასულან; process_at: როდის გადავლენ */
  current: { date: string; sides: TradeSide[]; pending?: boolean; process_at?: string }[];
  past: { season: string; total: number; teams: { team: string; trades: number }[] }[];
}

export interface AnnouncementsData {
  items: Announcement[];
  writable: boolean;
  admin: boolean;
}

export interface PickTeam {
  tid: number;
  name: string;
}

export interface PickMatchup {
  id: string;
  home: PickTeam;
  away: PickTeam;
  /** გამარჯვებულის team_id; 0 = ფრე; null = ჯერ არ დასრულებულა */
  winner: number | null;
}

export interface PickRow extends PickTeam {
  points: number;
  correct: number;
  total: number;
  perfect: number;
  oracle: number;
}

export interface PickemData {
  season: number;
  weeks: number;
  current_week: number;
  open_week: number | null;
  week: number;
  lock_at: number | null;
  locked: boolean;
  matchups: PickMatchup[];
  submitted: number[];
  /** team_id → {matchup_id: გამარჯვებული} — მხოლოდ ჩაკეტვის შემდეგ */
  picks: Record<string, Record<string, number>>;
  teams: (PickTeam & { has_pin: boolean })[];
  leaderboard: PickRow[];
  oracle: { week: number; tids: number[]; correct: number; of: number } | null;
  writable: boolean;
}

export interface Poll {
  id: string;
  q: string;
  options: string[];
  created: string;
  closed: boolean;
  /** team_id → ვარიანტის ინდექსი */
  votes: Record<string, number>;
}

export interface WallPost {
  id: string;
  tid: number;
  target: number | null;
  text: string;
  created: string;
  reactions?: Record<string, number>;
}

export interface CommunityData {
  polls: Poll[];
  wall: WallPost[];
  writable: boolean;
}

export interface TeamProjection {
  so_far: number;
  remaining: number;
  final: number;
  sd: number;
  games_left: number;
  /** კვირა → [საშუალო, sd] */
  weeks: Record<string, [number, number]>;
}

export interface Projections {
  week: number;
  today: number;
  slots: number;
  teams: Record<string, TeamProjection>;
}
