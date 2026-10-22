import { Link } from "react-router-dom";
import { ArrowLeftRight, ArrowRight, BarChart3, Radio, Table2 } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { key, projectedWin } from "@/lib/season";
import { cn, tone } from "@/lib/utils";
import type { LeagueData, RosterPlayer } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

type Owned = RosterPlayer & { owner: string };

/** ყველა გუნდის მოთამაშე ერთ სიაში, მფლობელით */
export function ownedPlayers(data: LeagueData): Owned[] {
  return data.managers.flatMap((m) => m.roster.map((p) => ({ ...p, owner: m.team })));
}

/** ამ კვირის ქულა (დაგროვილი) გუნდის სახელით */
const weekScore = (data: LeagueData, name: string) => Object.entries(data.projections?.teams ?? {}).find(([n]) => key(n) === key(name))?.[1]?.so_far ?? 0;

/** მორბენალი ხაზი მთავარ გვერდზე: მიმდინარე სეზონის ამბები */
export function useTicker(): string[] {
  const data = useData();
  const { current } = data;
  const players = ownedPlayers(data);
  const top = [...players].sort((a, b) => (b.total ?? 0) - (a.total ?? 0))[0];
  const perGame = [...players].filter((p) => (p.gp ?? 0) > 0).sort((a, b) => b.avg - a.avg)[0];
  const played = current.standings.some((s) => s.w + s.l > 0);
  const leader = current.standings[0];
  const weekLeader = [...current.standings].sort((a, b) => weekScore(data, b.name) - weekScore(data, a.name))[0];
  const trade = data.trades?.current?.[0];
  const injured = players.filter((p) => p.injury).length;
  const champ = data.champions[data.champions.length - 1];
  return [
    played && leader ? `ცხრილის ლიდერი: ${clean(leader.name)} (${leader.w}-${leader.l})` : null,
    weekLeader && weekScore(data, weekLeader.name) > 0 ? `კვირა ${data.projections?.week ?? current.week}: ${clean(weekLeader.name)} ლიდერობს ${fmt(Math.round(weekScore(data, weekLeader.name)))} ქულით` : null,
    top && top.total ? `სეზონის საუკეთესო: ${top.name} · ${fmt(top.total)} ქულა (${clean(top.owner)})` : null,
    perGame && perGame !== top ? `საუკეთესო საშუალო: ${perGame.name} · ${perGame.avg} თამაშზე` : null,
    trade ? `ბოლო ტრეიდი: ${trade.sides.map((s) => clean(s.team)).join(" ⇄ ")}` : null,
    injured ? `ტრავმით: ${injured} მოთამაშე ლიგაში` : null,
    champ ? `მოქმედი ჩემპიონი: ${clean(champ.team)} (${champ.season})` : null,
  ].filter(Boolean) as string[];
}

function Head({ icon, title, to, link }: { icon: React.ReactNode; title: string; to: string; link: string }) {
  return (
    <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        {icon} {title}
      </CardTitle>
      <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
        {link} <ArrowRight className="h-3 w-3" />
      </Link>
    </CardHeader>
  );
}

/** მთავარი გვერდის ბლოკი: მიმდინარე სეზონი (ცხრილი, ამ კვირის მატჩები, ლიდერები, ბოლო ტრეიდი) */
export default function ThisSeason() {
  const data = useData();
  const { current } = data;
  const week = data.projections?.week ?? current.week;
  const games = current.schedule.filter((g) => g.p === week);
  const leaders = ownedPlayers(data)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || b.per_game - a.per_game)
    .slice(0, 6);
  const trade = data.trades?.current?.[0];
  const tidOf = (n: string) => data.managers.find((m) => key(m.team) === key(n))?.tid;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            სეზონი {current.label}
          </h2>
          <p className="text-sm text-muted-foreground">კვირა {week}. ყველაფერი ESPN-იდან, ახლდება ყოველ წუთს.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        {/* ცხრილი */}
        <Card className="tone-card lift lg:col-span-3" style={tone("blue")}>
          <Head icon={<Table2 className="h-4 w-4 text-[hsl(var(--blue))]" />} title="ცხრილი" to="/standings" link="სრულად" />
          <CardContent className="space-y-1 pt-0">
            <div className="grid grid-cols-[20px_1fr_48px_64px] gap-2 px-1 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>#</span>
              <span>გუნდი</span>
              <span className="text-right">W-L</span>
              <span className="text-right">ეს კვირა</span>
            </div>
            {current.standings.map((s, i) => {
              const tid = tidOf(s.name);
              return (
                <Link
                  key={s.name}
                  to={tid ? `/team/${tid}` : "/standings"}
                  className="grid grid-cols-[20px_1fr_48px_64px] items-center gap-2 rounded-lg px-1 py-1.5 text-sm transition-colors hover:bg-white/[0.04]"
                >
                  <span className={cn("font-mono text-xs", i < (data.settings?.playoff_teams ?? 4) ? "text-win" : "text-muted-foreground")}>{i + 1}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    <TeamAvatar name={s.name} size={22} badge={false} />
                    <span className="truncate">{clean(s.name)}</span>
                  </span>
                  <span className="text-right tabular">
                    {s.w}-{s.l}
                  </span>
                  <span className="text-right text-muted-foreground tabular">{fmt(Math.round(weekScore(data, s.name)))}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* ამ კვირის მატჩები */}
        <Card className="tone-card lift lg:col-span-3" style={tone("red")}>
          <Head icon={<Radio className="h-4 w-4 text-[hsl(var(--red))]" />} title={`კვირა ${week}`} to="/live" link="Live" />
          <CardContent className="space-y-3 pt-0">
            {games.map((g) => {
              const p = projectedWin(data, g.h, g.a) ?? 0.5;
              return (
                <Link key={`${g.h}-${g.a}`} to="/live" className="block rounded-lg p-1.5 transition-colors hover:bg-white/[0.04]">
                  <div className="flex items-center gap-2 text-sm">
                    <TeamAvatar name={g.h} size={22} badge={false} />
                    <span className="min-w-0 flex-1 truncate">{clean(g.h)}</span>
                    <span className="font-semibold tabular">{fmt(Math.round(weekScore(data, g.h)))}</span>
                    <span className="text-xs text-muted-foreground">:</span>
                    <span className="font-semibold tabular">{fmt(Math.round(weekScore(data, g.a)))}</span>
                    <span className="min-w-0 flex-1 truncate text-right">{clean(g.a)}</span>
                    <TeamAvatar name={g.a} size={22} badge={false} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground tabular">
                    <span className="w-8">{Math.round(p * 100)}%</span>
                    <div className="flex h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="bg-[hsl(var(--red))]" style={{ width: `${p * 100}%` }} />
                      <div className="flex-1 bg-[hsl(var(--blue))]" />
                    </div>
                    <span className="w-8 text-right">{Math.round((1 - p) * 100)}%</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* ლიდერები */}
        <Card className="tone-card lift lg:col-span-4" style={tone("gold")}>
          <Head icon={<BarChart3 className="h-4 w-4 text-gold" />} title="სეზონის ლიდერები" to="/stats" link="სტატისტიკა" />
          <CardContent className="grid grid-cols-1 gap-2 pt-0 sm:grid-cols-2">
            {leaders.map((p, i) => (
              <div key={p.pid} className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-2">
                <span className={cn("w-4 text-center font-mono text-xs", i === 0 ? "text-gold" : "text-muted-foreground")}>{i + 1}</span>
                <PlayerPhoto pid={p.pid} className="h-10 w-10 shrink-0 rounded-full bg-muted object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <TeamAvatar name={p.owner} size={14} badge={false} />
                    <span className="truncate">{clean(p.owner)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold tabular">{fmt(p.total ?? 0)}</div>
                  <div className="text-[10px] text-muted-foreground tabular">
                    {p.gp ? `${p.avg} × ${p.gp}` : "ქულა"}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ბოლო ტრეიდი */}
        <Card className="tone-card lift lg:col-span-2" style={tone("win")}>
          <Head icon={<ArrowLeftRight className="h-4 w-4 text-win" />} title="ბოლო ტრეიდი" to="/trades" link="ყველა" />
          <CardContent className="space-y-3 pt-0">
            {!trade ? (
              <p className="text-sm text-muted-foreground">ამ სეზონში ჯერ ტრეიდი არ ყოფილა.</p>
            ) : (
              trade.sides.map((s) => (
                <div key={s.team} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <TeamAvatar name={s.team} size={20} badge={false} />
                    <span className="truncate">{clean(s.team)}</span>
                    <span className="text-xs font-normal text-muted-foreground">გასცა</span>
                  </div>
                  {s.gives.map((g) => (
                    <div key={g.name} className="flex items-center gap-2 pl-1 text-sm">
                      <PlayerPhoto pid={g.pid ?? undefined} className="h-7 w-7 rounded-full bg-muted object-cover" />
                      <span className="truncate">{g.name}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/** ჰეროს მარჯვენა ბარათი სეზონის განმავლობაში (დრაფტის მერე countdown-ის ნაცვლად) */
export function HeroWeek() {
  const data = useData();
  const week = data.projections?.week ?? data.current.week;
  const teams = Object.entries(data.projections?.teams ?? {}).sort((a, b) => b[1].so_far - a[1].so_far);
  const top = ownedPlayers(data).sort((a, b) => (b.total ?? 0) - (a.total ?? 0))[0];
  if (!teams.length) return null;
  const [leader, t] = teams[0];
  return (
    <Card className="tone-card overflow-hidden" style={tone("blue")}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[hsl(var(--red))]" /> კვირა {week}
          </span>
          <Link to="/live" className="text-xs text-muted-foreground hover:text-foreground">
            Live →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <TeamAvatar name={leader} size={52} />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">კვირის ლიდერი</div>
            <div className="truncate text-lg font-semibold">{clean(leader)}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-3xl font-extrabold tabular">{fmt(Math.round(t.so_far))}</div>
            <div className="text-[11px] text-muted-foreground tabular">პროგნოზი {fmt(Math.round(t.final))}</div>
          </div>
        </div>
        {top && (top.total ?? 0) > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5">
            <PlayerPhoto pid={top.pid} className="h-11 w-11 rounded-full bg-muted object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">სეზონის საუკეთესო</div>
              <div className="truncate text-sm font-medium">{top.name}</div>
            </div>
            <div className="text-right">
              <div className="font-bold tabular">{fmt(top.total ?? 0)}</div>
              <div className="text-[10px] text-muted-foreground">{clean(top.owner).slice(0, 16)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
