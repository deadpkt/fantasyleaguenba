import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeftRight, Award, CalendarRange, Crown, Lock, Shirt, Swords, TrendingUp } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt, plain } from "@/lib/format";
import { espnImage } from "@/lib/logos";
import { NBA, nbaLogo } from "@/lib/nba";
import { cn } from "@/lib/utils";
import { projectedWin } from "@/lib/season";
import { achievements, type Achievement } from "@/lib/badges";
import { LORE, type Lore } from "@/data/lore";
import Connections from "@/components/league/Connections";
import type { Manager } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import { CountUp } from "@/components/league/CountUp";

const same = (a: string, b: string) => plain(a) === plain(b);

function Photo({ m, size }: { m: Manager; size: number }) {
  const [broken, setBroken] = useState(false);
  if (!m.logo || broken) return <TeamAvatar name={m.team} size={size} badge={false} className="[&>*:first-child]:rounded-2xl" />;
  return (
    <img
      src={espnImage(m.logo)}
      alt={clean(m.team)}
      onError={() => setBroken(true)}
      className="rounded-2xl border-2 border-black object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function Section({ icon, title, sub, children, className }: { icon: ReactNode; title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-muted-foreground">{icon}</span> {title}
        </CardTitle>
        {sub && <CardDescription>{sub}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const TIER: Record<Achievement["tier"], string> = {
  gold: "var(--gold)",
  red: "var(--red)",
  blue: "var(--blue)",
  win: "var(--win)",
  fun: "200 80% 70%",
};

/** ბეჯი: მიღებული — ფერადი, დანარჩენი — ჩაკეტილი */
function BadgeTile({ b, i }: { b: Achievement; i: number }) {
  return (
    <div
      title={b.desc}
      className={cn(
        "badge-in group/b relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-300",
        b.earned ? "border-[hsl(var(--c)/0.3)] bg-white/[0.03] hover:border-[hsl(var(--c)/0.6)]" : "border-white/[0.06] bg-transparent",
      )}
      style={{ ["--c" as string]: TIER[b.tier], animationDelay: `${i * 45}ms` }}
    >
      <span className={cn("text-3xl", !b.earned && "opacity-25 grayscale")}>
        {b.icon}
      </span>
      <span className={cn("text-xs font-medium leading-tight", !b.earned && "text-muted-foreground/60")}>{b.name}</span>
      <span className="text-[10px] leading-tight text-muted-foreground">{b.desc}</span>
      {!b.earned && <Lock className="absolute right-2 top-2 h-3 w-3 text-muted-foreground/40" />}
    </div>
  );
}

/** გუნდის ისტორია და წარმოსახვითი ფანბეისი */
function Story({ lore, c1, left, right }: { lore: Lore; c1: string; left?: ReactNode; right?: ReactNode }) {
  const rows: [string, string][] = [
    ["სიმღერა", lore.fans.chant],
    ["მასკოტი", lore.fans.mascot],
    ["არენა", lore.fans.arena],
    ["მთავარი მეტოქე", lore.fans.rival],
    ["რიტუალი", lore.fans.ritual],
  ];
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-0.5" style={{ background: c1 }} />
          <CardContent className="space-y-4 p-5 sm:p-7">
            <div className="text-xs text-muted-foreground">ისტორია</div>
            <p className="text-xl font-semibold italic leading-snug sm:text-2xl">„{lore.tagline}“</p>
            <p className="leading-relaxed text-muted-foreground">{lore.story}</p>
          </CardContent>
        </Card>
        {left}
      </div>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div>
              <div className="text-xs text-muted-foreground">ფანბეისი</div>
              <div className="mt-1 text-2xl font-bold tracking-tight">{lore.fans.name}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">{lore.fans.size}</div>
            </div>
            <p className="text-sm text-muted-foreground">{lore.fans.vibe}</p>
            <dl className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {rows.map(([label, text]) => (
                <div key={label} className="grid grid-cols-[120px_1fr] gap-3 py-2.5 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] text-muted-foreground/70">* გამოგონილია, გასართობად.</p>
          </CardContent>
        </Card>
        {right}
      </div>
    </div>
  );
}

/** გვერდის ფონზე — იმ NBA გუნდის ლოგო და ფერები, რომლის გულშემატკივარიცაა */
function FanBackdrop({ fan, c1, c2 }: { fan: string; c1: string; c2: string }) {
  return createPortal(
    <div aria-hidden className="fan-bg pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(70% 60% at 85% 20%, ${c1}30, transparent 70%), radial-gradient(60% 60% at 10% 90%, ${c2}20, transparent 70%)` }}
      />
      <img src={nbaLogo(fan)} alt="" className="fan-logo absolute -right-[12vw] top-[8vh] h-[85vh] w-[85vh] max-w-none object-contain opacity-[0.07]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
    </div>,
    document.body,
  );
}

type Tab = "overview" | "story" | "rivals" | "badges";
const TABS: [Tab, string][] = [
  ["overview", "მიმოხილვა"],
  ["story", "ისტორია"],
  ["rivals", "მეტოქეები"],
  ["badges", "მიღწევები"],
];

export default function TeamProfile() {
  const { tid } = useParams();
  const data = useData();
  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => setTab("overview"), [tid]);
  const m = data.managers.find((x) => String(x.tid) === tid);
  if (!m) return <Navigate to="/managers" replace />;

  const nba = m.fan ? NBA[m.fan] : undefined;
  const c1 = nba?.primary ?? "#f97316";
  const c2 = nba?.secondary ?? "#3b82f6";
  const rank = data.current.standings.findIndex((t) => same(t.name, m.team)) + 1;
  const cur = data.current.standings[rank - 1];
  const at = data.alltime.find((r) => same(r.team, m.team));

  // კვირების გრაფიკი: მიმდინარე სეზონი (თუ კვირები უკვე დასრულდა), თორემ ბოლო დასრულებული
  const curGames = data.current.schedule.filter((g) => g.done && (same(g.h, m.team) || same(g.a, m.team))).sort((a, b) => a.p - b.p);
  const lastDone = data.seasons.find((s) => s.complete);
  const last = curGames.length ? { label: data.current.label } : lastDone;
  const weekly = lastDone?.weekly.teams.find((t) => m.seasons.some((s) => s.season === lastDone.label && same(s.team, t.name)) || same(t.name, m.team));
  const cells: ([number, 0 | 1 | 2] | null)[] = curGames.length
    ? curGames.map((g) => {
        const mine = same(g.h, m.team) ? g.hs : g.as;
        const opp = same(g.h, m.team) ? g.as : g.hs;
        return [mine, mine > opp ? 1 : mine < opp ? 0 : 2];
      })
    : (weekly?.scores ?? []);
  const vals = cells.map((c) => (c ? c[0] : 0));
  const max = Math.max(1, ...vals);
  const min = Math.min(...vals.filter(Boolean), max);

  // H2H
  const { teams, cells: h2h } = data.h2h;
  const me = teams.findIndex((t) => same(t, m.team) || m.seasons.some((x) => same(x.team, t)));
  const rivals =
    me >= 0
      ? teams
          .map((t, j) => ({ team: t, w: h2h[me][j][0], l: h2h[me][j][1] }))
          .filter((r, j) => j !== me && r.w + r.l > 0)
          .sort((a, b) => b.w - b.l - (a.w - a.l))
      : [];

  // ტრეიდები ამ სეზონში
  const trades = (data.trades?.current ?? []).filter((t) => t.sides.some((s) => same(s.team, m.team) || (s.to != null && same(s.to, m.team))));
  const badges = achievements(data, m);
  const earned = badges.filter((b) => b.earned).length;

  // ამ კვირის მატჩი
  const week = data.projections?.week ?? data.current.week;
  const game = data.current.schedule.find((g) => g.p === week && (same(g.h, m.team) || same(g.a, m.team)));
  const opp = game ? (same(game.h, m.team) ? game.a : game.h) : null;
  const pj = (n: string) => Object.entries(data.projections?.teams ?? {}).find(([k]) => same(k, n))?.[1];
  const mine = pj(m.team);
  const theirs = opp ? pj(opp) : undefined;
  const win = opp ? projectedWin(data, m.team, opp) : null;
  const oppTid = opp ? data.managers.find((x) => same(x.team, opp))?.tid : undefined;
  const seasonPts = m.roster.reduce((n, p) => n + (p.total ?? 0), 0);
  const roster = [...m.roster].sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || b.per_game - a.per_game);

  return (
    <div className="space-y-6 pb-4 pt-8 md:pt-12">
      {m.fan && <FanBackdrop key={m.fan} fan={m.fan} c1={c1} c2={c2} />}

      {/* ჰერო */}
      <section className="hero-in overflow-hidden rounded-2xl border border-white/[0.08] bg-card/95">
        {/* გუნდის ფერები: ორი სუფთა ზოლი */}
        <div className="flex h-1">
          <div className="flex-[3]" style={{ background: c1 }} />
          <div className="flex-[2]" style={{ background: c2 }} />
        </div>
        <div className="space-y-6 p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="shrink-0 self-start rounded-2xl border border-white/10 p-1 sm:self-auto">
              <Photo m={m} size={96} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="break-words text-4xl font-semibold tracking-tight sm:text-5xl">{clean(m.team)}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="font-mono">{m.abbrev}</span>
                {nba && (
                  <span className="flex items-center gap-1.5">
                    <img src={nbaLogo(m.fan!)} alt="" className="h-4 w-4 rounded-full bg-white object-contain p-[1px]" />
                    {nba.name}
                  </span>
                )}
                {rank > 0 && <span>#{rank} ცხრილში</span>}
                {m.titles > 0 && (
                  <span className="flex items-center gap-1 text-gold">
                    <Crown className="h-3.5 w-3.5" /> {m.titles}× ჩემპიონი
                  </span>
                )}
                {m.rookie && <span className="text-gold">Rookie</span>}
              </div>
            </div>
            {m.ovr != null && (
              <div className="text-left sm:text-right">
                <div className="text-4xl font-semibold leading-none tabular">
                  <CountUp value={m.ovr} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">OVR რეიტინგი</div>
              </div>
            )}
          </div>

          {/* სტატისტიკა ერთ ხაზზე */}
          <dl className="grid grid-cols-2 gap-y-4 border-t border-white/[0.08] pt-5 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                [data.current.label, cur ? `${cur.w}-${cur.l}` : "-"],
                ["ქულა სეზონში", seasonPts ? fmt(Math.round(seasonPts)) : "-"],
                ["კარიერა", m.rookie ? "-" : `${m.w}-${m.l}`],
                ["მოგება %", at && at.w + at.l > 0 ? `${(at.pct * 100).toFixed(1)}%` : "-"],
                ["საუკეთესო კვირა", m.best_week ? fmt(m.best_week) : "-"],
                ["პლეიოფი", m.rookie ? "-" : String(m.playoffs)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="border-l border-white/[0.08] pl-4">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ჩანართები */}
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("relative whitespace-nowrap px-3 py-2.5 text-sm transition-colors", tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {label}
            {id === "badges" && <span className="ml-1.5 text-xs text-muted-foreground tabular">{earned}</span>}
            {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
          </button>
        ))}
      </div>

      <div key={tab} className="page-in space-y-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
            {/* როსტერი */}
            <Section
              icon={<Shirt className="h-4 w-4" />}
              title="შემადგენლობა"
              sub={m.roster.length ? `${m.roster.length} მოთამაშე · ${data.current.label} სეზონის სტატისტიკა` : undefined}
            >
              {m.roster.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-muted-foreground">როსტერი დრაფტის შემდეგ გამოჩნდება.</p>
              ) : (
                <div className="-mx-2">
                  <div className="grid grid-cols-[1fr_auto] gap-3 px-2 pb-2 text-[11px] text-muted-foreground sm:grid-cols-[1fr_44px_150px_64px]">
                    <span>მოთამაშე</span>
                    <span className="hidden text-right sm:block">თამ.</span>
                    <span className="hidden text-right sm:block">PTS · REB · AST</span>
                    <span className="text-right">ქულა</span>
                  </div>
                  <div className="divide-y divide-white/[0.05]">
                    {roster.map((p) => (
                      <div key={p.pid} className="grid grid-cols-[1fr_auto] items-center gap-3 px-2 py-2 sm:grid-cols-[1fr_44px_150px_64px]">
                        <div className="flex min-w-0 items-center gap-3">
                          <PlayerPhoto pid={p.pid} className="h-9 w-9 shrink-0 rounded-full bg-muted object-cover" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link to={`/player/${p.pid}`} className="truncate text-sm font-medium hover:underline">
                                {p.name}
                              </Link>
                              {p.injury && <span className="shrink-0 rounded bg-loss/15 px-1 text-[9px] font-medium text-loss">{p.injury.replace(/_/g, " ")}</span>}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {p.pos} · {p.pro}
                              {p.week_left > 0 && <span> · {p.week_left} თამ. ამ კვირაში</span>}
                            </div>
                          </div>
                        </div>
                        <span className="hidden text-right text-sm text-muted-foreground tabular sm:block">{p.gp || "-"}</span>
                        <span className="hidden text-right text-sm text-muted-foreground tabular sm:block">
                          {p.season_line && p.gp ? `${p.season_line.PTS} · ${p.season_line.REB} · ${p.season_line.AST}` : "-"}
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-semibold tabular">{p.total ? fmt(p.total) : "-"}</div>
                          <div className="text-[10px] text-muted-foreground tabular">{p.gp ? `${p.avg}/თამ.` : `პროგ. ${p.per_game}`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <div className="space-y-6">
              {/* ამ კვირის მატჩი */}
              {opp && (
                <Section icon={<Swords className="h-4 w-4" />} title={`კვირა ${week}`} sub="ამ კვირის მატჩი">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="min-w-0">
                      <TeamAvatar name={m.team} size={36} badge={false} />
                      <div className="mt-2 truncate text-sm font-medium">{clean(m.team)}</div>
                      <div className="text-2xl font-semibold tabular">{mine ? fmt(Math.round(mine.so_far)) : "-"}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <Link to={oppTid ? `/team/${oppTid}` : "/live"} className="min-w-0 text-right">
                      <div className="flex justify-end">
                        <TeamAvatar name={opp} size={36} badge={false} />
                      </div>
                      <div className="mt-2 truncate text-sm font-medium hover:underline">{clean(opp)}</div>
                      <div className="text-2xl font-semibold tabular">{theirs ? fmt(Math.round(theirs.so_far)) : "-"}</div>
                    </Link>
                  </div>
                  {win != null && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground tabular">
                        <span>
                          მოგების შანსი <b className="text-foreground">{Math.round(win * 100)}%</b>
                        </span>
                        <span>
                          პროგნოზი {mine ? fmt(Math.round(mine.final)) : "-"} : {theirs ? fmt(Math.round(theirs.final)) : "-"}
                        </span>
                      </div>
                      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="bg-foreground transition-all duration-700" style={{ width: `${win * 100}%` }} />
                      </div>
                      {mine && <div className="text-[11px] text-muted-foreground">{mine.games_left} თამაში დარჩა</div>}
                    </div>
                  )}
                </Section>
              )}

              {/* კვირები */}
              {vals.length > 0 && last && (
                <Section icon={<TrendingUp className="h-4 w-4" />} title={`${last.label}, კვირების მიხედვით`} sub="მწვანე: მოგება, წითელი: წაგება">
                  <div className="flex h-32 items-end gap-[3px]">
                    {cells.map((c, i) => (
                      <div
                        key={i}
                        title={c ? `კვირა ${i + 1}: ${c[0]}` : ""}
                        className={cn("bar-grow flex-1 origin-bottom rounded-t-sm", !c ? "bg-white/5" : c[1] === 1 ? "bg-win/70" : c[1] === 0 ? "bg-loss/60" : "bg-white/30")}
                        style={{ height: c ? `${12 + ((c[0] - min) / Math.max(1, max - min)) * 88}%` : "6%", animationDelay: `${150 + i * 30}ms` }}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* ტრეიდები */}
              <Section icon={<ArrowLeftRight className="h-4 w-4" />} title="ტრეიდები ამ სეზონში">
                {trades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ჯერ ტრეიდი არ ყოფილა.</p>
                ) : (
                  <div className="space-y-2">
                    {trades.map((t, i) => (
                      <div key={i} className="rounded-lg border border-white/10 p-3 text-sm">
                        <div className="mb-1 text-xs text-muted-foreground">
                          {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          {t.pending && <span className="ml-2 rounded bg-white/10 px-1.5 text-foreground">განხილვაში</span>}
                        </div>
                        {t.sides.map((sd, k) => (
                          <div key={k}>
                            <b>{clean(sd.team)}</b> გასცა: {sd.gives.map((g) => g.name).join(", ")}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        )}

        {tab === "story" && (
          <div className="space-y-6">
            {LORE[m.tid] && <Story lore={LORE[m.tid]} c1={c1} />}
            {m.seasons.length > 0 && (
              <Section icon={<CalendarRange className="h-4 w-4" />} title="სეზონები">
                <ol className="relative space-y-3 border-l border-white/10 pl-4">
                  {m.seasons.map((x) => (
                    <li key={x.season} className="relative">
                      <span className={cn("absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-black", x.champ ? "bg-gold" : "bg-white/30")} />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-muted-foreground">{x.season}</span>
                        <span className="font-medium">{x.rec}</span>
                        {x.champ && <span className="flex items-center gap-1 text-xs text-gold"><Crown className="h-3 w-3" /> ჩემპიონი</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{clean(x.team)}</div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </div>
        )}

        {tab === "rivals" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              <Connections data={data} m={m} part="map" />
              <Connections data={data} m={m} part="list" />
            </div>
            <Section icon={<Swords className="h-4 w-4" />} title="Head to Head" sub="ყველა სეზონი, რეგულარული">
              {rivals.length === 0 ? (
                <p className="text-sm text-muted-foreground">ჯერ არცერთი შეხვედრა.</p>
              ) : (
                <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
                  {rivals.map((r) => {
                    const pct = r.w / (r.w + r.l);
                    const other = data.managers.find((x) => same(x.team, r.team) || x.seasons.some((z) => same(z.team, r.team)));
                    return (
                      <Link key={r.team} to={other ? `/team/${other.tid}` : "/h2h"} className="block rounded-lg px-1 py-1 transition-colors hover:bg-white/[0.04]">
                        <div className="flex items-center gap-2 text-sm">
                          <TeamAvatar name={r.team} size={22} badge={false} />
                          <span className="flex-1 truncate">{clean(r.team)}</span>
                          <span className={cn("font-mono tabular", r.w > r.l ? "text-win" : r.w < r.l ? "text-loss" : "text-muted-foreground")}>
                            {r.w}-{r.l}
                          </span>
                        </div>
                        <div className="mt-1 flex h-1 overflow-hidden rounded-full bg-loss/40">
                          <div className="bar-fill h-full origin-left bg-win" style={{ width: `${pct * 100}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>
        )}

        {tab === "badges" && (
          <Section icon={<Award className="h-4 w-4" />} title="მიღწევები" sub={`${earned} / ${badges.length} მიღებული. მიიტანე მაუსი დეტალებისთვის.`}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {badges.map((b, i) => (
                <BadgeTile key={b.id} b={b} i={i} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* სხვა გუნდები */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/[0.08] pt-6">
        <span className="mr-2 text-xs text-muted-foreground">სხვა გუნდები</span>
        {data.managers
          .filter((x) => x.tid !== m.tid)
          .map((x) => (
            <Link key={x.tid} to={`/team/${x.tid}`} title={clean(x.team)} className="rounded-full opacity-70 transition-opacity hover:opacity-100">
              <TeamAvatar name={x.team} size={32} badge={false} />
            </Link>
          ))}
      </div>
    </div>
  );
}
