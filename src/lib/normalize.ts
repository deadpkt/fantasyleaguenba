import type { LeagueData, LiveData, LivePlayer, LiveTeam, PlayerCard, RosterPlayer, WaiverPlayer } from "@/types";

/** სერვერის ძველი პასუხიც (CDN-ის ქეში, ან ლოკალური სერვერი, რომელიც კოდის განახლებამდე ჩაირთო)
 *  რომ არ ამტვრევდეს გვერდს: აკლებულ ველებს გონივრულ ნაგულისხმევ მნიშვნელობებს ვუწერთ. */
const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);

function player<T extends RosterPlayer>(p: T): T {
  const per = num(p.per_game, num(p.projected_avg, num(p.avg)));
  return {
    ...p,
    avg: num(p.avg),
    projected: num(p.projected),
    projected_avg: num(p.projected_avg),
    gp: num(p.gp),
    total: num(p.total),
    season_line: p.season_line ?? null,
    per_game: per,
    week_games: num(p.week_games),
    week_left: num(p.week_left),
    week_expected: num(p.week_expected),
    ros_games: num(p.ros_games),
    injury: p.injury ?? null,
  };
}

export function normalizeLeague(d: LeagueData): LeagueData {
  return {
    ...d,
    managers: (d.managers ?? []).map((m) => ({
      ...m,
      roster: (m.roster ?? []).map(player),
      season_acquisitions: num(m.season_acquisitions),
      season_trades: num(m.season_trades),
    })),
    waivers: (d.waivers ?? []).map((w) => player(w as WaiverPlayer)),
    current_draft: d.current_draft ?? [],
    projections: d.projections ?? null,
    current: { ...d.current, schedule: d.current?.schedule ?? [] },
    seasons: d.seasons ?? [],
    trades: d.trades ? { current: d.trades.current ?? [], past: d.trades.past ?? [] } : undefined,
    activity: d.activity ?? [],
  };
}

function livePlayer(p: LivePlayer): LivePlayer {
  return {
    ...p,
    points: num(p.points),
    today: num(p.today),
    status: p.status ?? (p.played ? "final" : "none"),
    tip: p.tip ?? null,
    today_line: p.today_line ?? null,
    week_line: p.week_line ?? null,
    per_game: num(p.per_game),
    week_left: num(p.week_left),
    week_games: num(p.week_games),
    games: p.games ?? {},
  };
}

function liveTeam(t: LiveTeam): LiveTeam {
  return {
    ...t,
    tid: t.tid ?? null,
    score: num(t.score),
    today: num(t.today),
    projected: t.projected ?? null,
    espn_projected: t.espn_projected ?? null,
    remaining: t.remaining ?? null,
    games_left: t.games_left ?? null,
    sd: t.sd ?? null,
    win: t.win ?? null,
    starters: (t.starters ?? []).map(livePlayer),
    bench: (t.bench ?? []).map(livePlayer),
    departed: t.departed ?? [],
  };
}

export function normalizeLive(d: LiveData): LiveData {
  return { ...d, today: num(d.today), days: d.days ?? [], matchups: (d.matchups ?? []).map((m) => ({ home: liveTeam(m.home), away: liveTeam(m.away) })) };
}

/** მოთამაშის გვერდი: ძველ (ქეშირებულ) პასუხს ახალი ველები შეიძლება აკლდეს */
export function normalizePlayer(d: PlayerCard): PlayerCard {
  const season = d.season ?? ({} as PlayerCard["season"]);
  return {
    ...d,
    jersey: d.jersey ?? null,
    pos_rank: d.pos_rank ?? null,
    owned: d.owned ?? null,
    adp: d.adp ?? null,
    outlook: d.outlook ?? null,
    projection: d.projection ?? null,
    last_season: d.last_season ?? null,
    owner: d.owner ?? null,
    season: { ...season, label: season.label ?? "", gp: num(season.gp), total: num(season.total), avg: num(season.avg), projected_avg: num(season.projected_avg), per_game: num(season.per_game), line: season.line ?? null },
    games: d.games ?? [],
    upcoming: d.upcoming ?? [],
    drafts: d.drafts ?? [],
    news: d.news ?? [],
  };
}
