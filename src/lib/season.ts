import type { LeagueData } from "@/types";
import { clean, plain } from "@/lib/format";

/** სახელის გასაღები — ESPN-ში ერთი გუნდი ზოგჯერ ორმაგი ჰარით ან 🏆-ით მოდის */
export const key = (name: string) => plain(name).toLowerCase();

/* ───────────── მათემატიკა ───────────── */

/** სტანდარტული ნორმალური განაწილების CDF */
export function phi(x: number) {
  // Abramowitz–Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

function gauss(random = Math.random) {
  let u = 0;
  while (!u) u = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/** მატჩის მოგების შანსი პროგნოზირებული (ან მიმდინარე) ქულით */
export function winProb(home: { score: number; projected: number | null }, away: { score: number; projected: number | null }) {
  const h = home.projected ?? home.score;
  const a = away.projected ?? away.score;
  if (h + a <= 0) return 0.5;
  const sigma = Math.max(40, 0.09 * ((h + a) / 2));
  return phi((h - a) / sigma);
}

/* ───────────── სეზონის მდგომარეობა ───────────── */

type TeamState = { name: string; scores: number[]; results: (0 | 1 | 2)[]; w: number; l: number; pf: number };

/** მიმდინარე სეზონის თამაშები → თითო გუნდის კვირები (კვირა `upTo`-მდე ჩათვლით) */
function stateAt(data: LeagueData, upTo: number) {
  const teams = new Map<string, TeamState>();
  for (const s of data.current.standings) teams.set(key(s.name), { name: clean(s.name), scores: [], results: [], w: 0, l: 0, pf: 0 });
  const games = data.current.schedule.filter((g) => g.done && g.p <= upTo).sort((a, b) => a.p - b.p);
  for (const g of games) {
    const H = teams.get(key(g.h));
    const A = teams.get(key(g.a));
    if (!H || !A) continue;
    H.scores.push(g.hs);
    A.scores.push(g.as);
    H.pf += g.hs;
    A.pf += g.as;
    const r: 0 | 1 | 2 = g.hs > g.as ? 1 : g.hs < g.as ? 0 : 2;
    H.results.push(r);
    A.results.push(r === 2 ? 2 : r === 1 ? 0 : 1);
    if (r === 1) (H.w++, A.l++);
    else if (r === 0) (A.w++, H.l++);
  }
  return teams;
}

export const lastDoneWeek = (data: LeagueData) => Math.max(0, ...data.current.schedule.filter((g) => g.done).map((g) => g.p));

/** "სასტარტო ძალა": მიმდინარე სეზონის დრაფტირებული roster-ის ESPN projections.
 * რეალური კვირების დაგროვებასთან ერთად projection-ის წონა მცირდება. */
function priors(data: LeagueData) {
  const weeks = data.settings?.regular_season_weeks || 19;
  const availability = (injury: string | null) => {
    const status = (injury || "").toUpperCase();
    if (status.includes("OUT") || status.includes("IR")) return 0.8;
    if (status.includes("SUSP")) return 0.7;
    if (status.includes("DOUBT")) return 0.9;
    if (status.includes("DAY_TO_DAY") || status.includes("QUESTION")) return 0.97;
    return 1;
  };
  const projected = data.managers.map((m) => {
    const players = m.roster
      .map((p) => ({ total: (p.projected || 0) * availability(p.injury), avg: p.projected_avg || 0 }))
      .filter((p) => p.total > 0 || p.avg > 0);
    const byAvg = [...players].sort((a, b) => b.avg - a.avg);
    const season = players.reduce((sum, p) => sum + p.total, 0);
    const rotation = byAvg.slice(0, 10).reduce((sum, p) => sum + p.avg, 0);
    const stars = byAvg.slice(0, 3).reduce((sum, p) => sum + p.avg, 0);
    const depth = byAvg.slice(5, 10).reduce((sum, p) => sum + p.avg, 0);
    return { name: m.team, season, rotation, stars, depth, weekly: season / weeks };
  });
  const metricAvg = (field: "season" | "rotation" | "stars" | "depth") =>
    projected.reduce((sum, team) => sum + team[field], 0) / Math.max(projected.length, 1) || 1;
  const averages = {
    season: metricAvg("season"),
    rotation: metricAvg("rotation"),
    stars: metricAvg("stars"),
    depth: metricAvg("depth"),
  };
  const composite = projected.map((team) => ({
    ...team,
    strength:
      0.5 * (team.season / averages.season) +
      0.25 * (team.rotation / averages.rotation) +
      0.15 * (team.stars / averages.stars) +
      0.1 * (team.depth / averages.depth),
  }));
  const strengthAvg = composite.reduce((sum, team) => sum + team.strength, 0) / Math.max(composite.length, 1);
  const strengthSd = Math.sqrt(composite.reduce((sum, team) => sum + (team.strength - strengthAvg) ** 2, 0) / Math.max(composite.length, 1)) || 1;
  const known = projected.filter((x) => x.weekly > 0).map((x) => x.weekly);
  const avg = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 2000;
  const out = new Map<string, number>();
  const ratings = new Map<string, number>();
  for (const team of composite) {
    const quality = team.strength / Math.max(strengthAvg, 0.01);
    out.set(key(team.name), team.weekly > 0 ? team.weekly * (0.78 + 0.22 * quality) : avg);
    ratings.set(key(team.name), Math.max(60, Math.min(99, 84 + 7 * ((team.strength - strengthAvg) / strengthSd))));
  }
  for (const s of data.current.standings) if (!out.has(key(s.name))) out.set(key(s.name), avg);
  return { map: out, ratings, avg };
}

/* ───────────── Power Rankings ───────────── */

export interface PowerRow {
  name: string;
  rank: number;
  prev: number | null;
  score: number;
  w: number;
  l: number;
  ppg: number;
  last: number[];
  streak: string;
  note: string;
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pick = <T,>(arr: T[], seed: string) => arr[hash(seed) % arr.length];

function streakOf(results: (0 | 1 | 2)[]) {
  if (!results.length) return "";
  const lastR = results[results.length - 1];
  let n = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === lastR; i--) n++;
  return `${lastR === 1 ? "W" : lastR === 0 ? "L" : "T"}${n}`;
}

function note(r: Omit<PowerRow, "note">, total: number, week: number) {
  const up = r.prev != null ? r.prev - r.rank : 0;
  const s = `${r.name}${week}`;
  if (week === 0) {
    if (r.rank === 1) return pick(["სეზონის მთავარი ფავორიტი.", "ქაღალდზე ყველაზე ძლიერია, ვნახოთ მოედანზე."], s);
    if (r.rank === total) return pick(["ბოლოდან იწყებს, მაგრამ დრაფტი ყველაფერს შეცვლის.", "ჯერ არავინ ელის მისგან ბევრს."], s);
    return pick(["ყველაფერს დრაფტი გადაწყვეტს.", "შეიძლება მოულოდნელად აფეთქდეს.", "შუაშია, ჯერ არაფერი ვიცით."], s);
  }
  if (r.streak.startsWith("W") && Number(r.streak.slice(1)) >= 3) return pick([`🔥 ${r.streak.slice(1)} მოგება ზედიზედ. ვინ გააჩერებს?`, `ცეცხლზეა, ${r.streak.slice(1)} ზედიზედ მოიგო.`], s);
  if (r.streak.startsWith("L") && Number(r.streak.slice(1)) >= 3) return pick([`🥶 ${r.streak.slice(1)} წაგება ზედიზედ. ტრეიდის დროა.`, "ეს სერია მალე უნდა გაწყვიტოს."], s);
  if (up >= 2) return pick([`⬆️ +${up} ადგილი, კარგი კვირა ჰქონდა.`, "ზემოთ მიიწევს."], s);
  if (up <= -2) return pick([`⬇️ ${up} ადგილი, ცუდი კვირა იყო.`, "ჩამოვარდა, ახლა უნდა გამოსწორდეს."], s);
  if (r.rank === 1) return pick(["ჯერჯერობით პირველია.", "ჯერ ვერავინ ჩამოაგდო."], s);
  if (r.rank === total) return pick(["ბოლოა, მაგრამ სეზონი გრძელია.", "ამაზე ქვემოთ ვეღარ ჩავა."], s);
  return pick(["სტაბილურად თამაშობს.", "შუაშია, თავის შანსს ელოდება.", "ფორმა თანდათან უმჯობესდება."], s);
}

function rankAt(data: LeagueData, week: number) {
  const pr = priors(data);
  const st = stateAt(data, week);
  const rows = [...st.values()].map((t) => {
    const n = t.scores.length;
    const ppg = n ? t.pf / n : pr.map.get(key(t.name)) ?? pr.avg;
    const last = t.scores.slice(-3);
    const lastAvg = last.length ? last.reduce((a, b) => a + b, 0) / last.length : ppg;
    const pct = n ? (t.w + 0.5 * (n - t.w - t.l)) / n : 0.5;
    return { t, ppg, lastAvg, pct, priorScore: pr.ratings.get(key(t.name)) ?? 84 };
  });
  const maxPpg = Math.max(...rows.map((r) => r.ppg), 1);
  const maxLast = Math.max(...rows.map((r) => r.lastAvg), 1);
  const scored = rows.map((r) => {
    if (!week) return { ...r, score: r.priorScore };
    const games = r.t.scores.length;
    const liveScore = 45 * r.pct + 35 * (r.ppg / maxPpg) + 20 * (r.lastAvg / maxLast);
    const rosterWeight = Math.max(0.2, 4 / (4 + games));
    return { ...r, score: rosterWeight * r.priorScore + (1 - rosterWeight) * liveScore };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function powerRankings(data: LeagueData): { week: number; rows: PowerRow[] } {
  const week = lastDoneWeek(data);
  const now = rankAt(data, week);
  const before = week > 1 ? rankAt(data, week - 1) : null;
  const prevRank = new Map(before?.map((r, i) => [key(r.t.name), i + 1]));
  const rows = now.map((r, i) => {
    const base = {
      name: r.t.name,
      rank: i + 1,
      prev: before ? prevRank.get(key(r.t.name)) ?? null : null,
      score: Math.round(r.score),
      w: r.t.w,
      l: r.t.l,
      ppg: Math.round(r.ppg),
      last: r.t.scores.slice(-5),
      streak: streakOf(r.t.results),
    };
    return { ...base, note: note(base, now.length, week) };
  });
  return { week, rows };
}

/* ───────────── პლეიოფის შანსები (მონტე-კარლო) ───────────── */

export interface OddsRow {
  name: string;
  playoffs: number;
  final: number;
  title: number;
  seed: number;
  w: number;
  l: number;
  expected: number;
  trend: number;
}

export function playoffOdds(data: LeagueData, sims = 6000): OddsRow[] {
  const P = data.settings?.playoff_teams || 4;
  const pr = priors(data);
  const st = stateAt(data, 99);
  const names = [...st.keys()];
  // ძალა: მიმდინარე სეზონის რეალური საშუალო + ამავე სეზონის roster projection (3 კვირის წონით)
  const mean = new Map<string, number>();
  const trends = new Map<string, number>();
  for (const k of names) {
    const t = st.get(k)!;
    const n = t.scores.length;
    const rawPrior = pr.map.get(k) ?? pr.avg;
    // Preseason projections are estimates, not certainties. Regress them toward
    // league average so a 19-week fantasy season does not become deterministic.
    const prior = pr.avg + 0.58 * (rawPrior - pr.avg);
    const seasonAvg = n ? t.pf / n : prior;
    const recent = t.scores.slice(-3);
    const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : prior;
    const formWeight = Math.min(2, recent.length * 0.6);
    const priorWeight = Math.max(1.5, 4.5 - n * 0.25);
    const expected = (priorWeight * prior + n * seasonAvg + formWeight * recentAvg) / (priorWeight + n + formWeight);
    mean.set(k, expected);
    trends.set(k, n ? (recentAvg - seasonAvg) / Math.max(seasonAvg, 1) : 0);
  }
  let seed = hash(`${data.current.label}|${data.current.schedule.map((g) => `${g.p}:${g.hs}:${g.as}:${g.done ? 1 : 0}`).join("|")}`) || 1;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const played = Math.max(0, ...[...st.values()].map((team) => team.scores.length));
  const weeklyVariance = Math.max(0.13, 0.19 - played * 0.003);
  const sd = (k: string) => Math.max(300, weeklyVariance * (mean.get(k) ?? pr.avg));
  const roll = (k: string) => (mean.get(k) ?? pr.avg) + gauss(random) * sd(k);
  const remaining = data.current.schedule.filter((g) => !g.done);

  const tally = new Map(names.map((k) => [k, { playoffs: 0, final: 0, title: 0, seedSum: 0 }]));
  for (let i = 0; i < sims; i++) {
    const w = new Map(names.map((k) => [k, st.get(k)!.w]));
    const pf = new Map(names.map((k) => [k, st.get(k)!.pf]));
    for (const g of remaining) {
      const h = key(g.h);
      const a = key(g.a);
      if (!w.has(h) || !w.has(a)) continue;
      const hs = roll(h);
      const as = roll(a);
      w.set(hs > as ? h : a, w.get(hs > as ? h : a)! + 1);
      pf.set(h, pf.get(h)! + hs);
      pf.set(a, pf.get(a)! + as);
    }
    const order = [...names].sort((x, y) => w.get(y)! - w.get(x)! || pf.get(y)! - pf.get(x)!);
    const seeds = order.slice(0, P);
    seeds.forEach((k, s) => {
      const t = tally.get(k)!;
      t.playoffs++;
      t.seedSum += s + 1;
    });
    // ბრეკეტი: 1–4, 2–3 → ფინალი (ორკვირიანი მატჩები)
    const duel = (a: string, b: string) => (roll(a) + roll(a) > roll(b) + roll(b) ? a : b);
    let finalists: string[];
    if (seeds.length >= 4) finalists = [duel(seeds[0], seeds[3]), duel(seeds[1], seeds[2])];
    else finalists = seeds.slice(0, 2);
    finalists.forEach((k) => tally.get(k)!.final++);
    if (finalists.length === 2) tally.get(duel(finalists[0], finalists[1]))!.title++;
  }
  return names
    .map((k) => {
      const t = tally.get(k)!;
      const s = st.get(k)!;
      return {
        name: s.name,
        playoffs: t.playoffs / sims,
        final: t.final / sims,
        title: t.title / sims,
        seed: t.playoffs ? t.seedSum / t.playoffs : 0,
        w: s.w,
        l: s.l,
        expected: Math.round(mean.get(k) ?? pr.avg),
        trend: trends.get(k) ?? 0,
      };
    })
    .sort((a, b) => b.title - a.title || b.playoffs - a.playoffs);
}
