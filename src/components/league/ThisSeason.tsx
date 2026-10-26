import { Link } from "react-router-dom";
import { Activity as ActivityIcon, ArrowLeftRight, ArrowRight, BarChart3, Radio, Table2, UserMinus, UserPlus, type LucideIcon } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { key, projectedWin } from "@/lib/season";
import { cn } from "@/lib/utils";
import { useMyTeam } from "@/lib/myTeam";
import type { LeagueData, RosterPlayer } from "@/types";
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

/** ბლოკი ახალ სტილში: სათაური + ბმული, ქვემოთ შიგთავსი */
function Block({ icon: Icon, title, to, link, children, className }: { icon: LucideIcon; title: string; to: string; link: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-white/[0.08] bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" /> {title}
        </h3>
        <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          {link} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </section>
  );
}

/** ამ კვირის მატჩი ტაბლოს სტილში (როგორც Live-ზე) */
function MatchCard({ h, a, mine }: { h: string; a: string; mine?: boolean }) {
  const data = useData();
  const p = projectedWin(data, h, a) ?? 0.5;
  const sh = weekScore(data, h);
  const sa = weekScore(data, a);
  const row = (name: string, score: number, win: number, color: string, lead: boolean) => (
    <div className="flex items-center gap-2.5">
      <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: `hsl(var(${color}))`, opacity: lead ? 1 : 0.35 }} />
      <TeamAvatar name={name} size={28} badge={false} />
      <span className={cn("min-w-0 flex-1 truncate text-sm", lead ? "font-semibold" : "text-muted-foreground")}>{clean(name)}</span>
      <span className="w-9 text-right text-[11px] text-muted-foreground tabular">{Math.round(win * 100)}%</span>
      <span className={cn("w-14 text-right text-lg font-semibold tabular", !lead && "text-muted-foreground")}>{fmt(Math.round(score))}</span>
    </div>
  );
  return (
    <Link to="/live" className={cn("block space-y-2 rounded-xl border p-3 transition-colors hover:border-white/20", mine ? "border-white/25 bg-white/[0.03] sm:col-span-2" : "border-white/[0.06]")}>
      {mine && <div className="text-[10px] font-semibold text-foreground/80">შენი მატჩი</div>}
      {row(h, sh, p, "--red", sh >= sa)}
      {row(a, sa, 1 - p, "--blue", sa >= sh)}
      <div className="flex h-1 overflow-hidden rounded-full bg-white/10">
        <div className="bg-[hsl(var(--red))]" style={{ width: `${p * 100}%` }} />
        <div className="w-0.5 bg-card" />
        <div className="flex-1 bg-[hsl(var(--blue))]" />
      </div>
    </Link>
  );
}

/** ბოლო აქტივობა ESPN-იდან: აყვანა, გაშვება, ტრეიდი */
function Activity() {
  const data = useData();
  const list = (data.activity ?? []).slice(0, 6);
  if (!list.length) return <p className="text-sm text-muted-foreground">ჯერ აქტივობა არ ყოფილა.</p>;
  const ago = (iso: string) => {
    const h = Math.round((Date.now() - +new Date(iso)) / 3600_000);
    return h < 1 ? "ახლა" : h < 24 ? `${h} სთ` : `${Math.round(h / 24)} დღე`;
  };
  return (
    <div className="space-y-1">
      {list.map((a) => {
        const trade = a.kind === "trade" || a.kind === "trade_review";
        const who = a.added?.[0] ?? a.dropped?.[0];
        return (
          <div key={a.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
            {trade ? (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[hsl(var(--blue))]/15 text-[hsl(var(--blue))]">
                <ArrowLeftRight className="h-4 w-4" />
              </span>
            ) : (
              <span className="relative h-9 w-9 shrink-0">
                <PlayerPhoto pid={who?.pid} className="h-9 w-9 rounded-full bg-muted" />
                <span className={cn("absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-[hsl(var(--card))]", a.added?.length ? "bg-win" : "bg-zinc-500")}>
                  {a.added?.length ? <UserPlus className="h-2.5 w-2.5 text-black" /> : <UserMinus className="h-2.5 w-2.5 text-black" />}
                </span>
              </span>
            )}
            <div className="min-w-0 flex-1 text-sm">
              {trade ? (
                <div className="truncate">
                  <span className="font-medium">ტრეიდი</span> <span className="text-muted-foreground">{a.sides?.map((x) => clean(x.team)).join(" ↔ ")}</span>
                </div>
              ) : (
                <div className="truncate">
                  <span className="font-medium">{clean(a.team ?? "")}</span>{" "}
                  <span className="text-muted-foreground">{a.added?.length ? `აიყვანა ${a.added.map((x) => x.name).join(", ")}` : `გაუშვა ${a.dropped?.map((x) => x.name).join(", ")}`}</span>
                </div>
              )}
              {!trade && a.added?.length && a.dropped?.length ? <div className="truncate text-[11px] text-muted-foreground">გაუშვა {a.dropped.map((x) => x.name).join(", ")}</div> : null}
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground tabular">{ago(a.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** მთავარი გვერდის ბლოკი: ამ კვირის მატჩები, ცხრილი, ლიდერები, ბოლო აქტივობა */
export default function ThisSeason() {
  const data = useData();
  const { current } = data;
  const week = data.projections?.week ?? current.week;
  const myTid = useMyTeam();
  const myName = data.managers.find((m) => m.tid === myTid)?.team;
  const isMine = (n: string) => !!myName && key(n) === key(myName);
  const games = current.schedule.filter((g) => g.p === week).sort((x, y) => Number(isMine(y.h) || isMine(y.a)) - Number(isMine(x.h) || isMine(x.a)));
  const leaders = ownedPlayers(data)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || b.per_game - a.per_game)
    .slice(0, 6);
  const tidOf = (n: string) => data.managers.find((m) => key(m.team) === key(n))?.tid;
  const table = current.table?.length ? current.table.map((r) => ({ name: r.name, seed: r.seed, w: r.w, l: r.l, pf: r.pf })) : current.standings.map((s, i) => ({ ...s, seed: i + 1 }));
  const playoffs = data.settings?.playoff_teams ?? 4;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">სეზონი {current.label}</h2>
          <p className="text-sm text-muted-foreground">კვირა {week}. ყველაფერი ESPN-იდან, ახლდება ყოველ წუთს.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Block icon={Radio} title={`კვირა ${week}`} to="/live" link="Live" className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {games.map((g) => (
              <MatchCard key={`${g.h}-${g.a}`} h={g.h} a={g.a} mine={isMine(g.h) || isMine(g.a)} />
            ))}
          </div>
        </Block>

        <Block icon={Table2} title="ცხრილი" to="/standings" link="სრულად" className="lg:col-span-5">
          <div className="grid grid-cols-[18px_1fr_44px_56px] gap-2 px-1 pb-1.5 text-[10px] text-muted-foreground">
            <span>#</span>
            <span>გუნდი</span>
            <span className="text-right">W-L</span>
            <span className="text-right">PF</span>
          </div>
          {table.map((s, i) => {
            const tid = tidOf(s.name);
            return (
              <Link
                key={s.name}
                to={tid ? `/team/${tid}` : "/standings"}
                className={cn(
                  "grid grid-cols-[18px_1fr_44px_56px] items-center gap-2 rounded-lg px-1 py-1.5 text-sm transition-colors hover:bg-white/[0.04]",
                  i === playoffs - 1 && "mb-1 border-b border-white/[0.08] pb-2",
                  isMine(s.name) && "bg-white/[0.06]",
                )}
              >
                <span className={cn("text-xs tabular", i < playoffs ? "text-foreground" : "text-muted-foreground")}>{s.seed || i + 1}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <TeamAvatar name={s.name} size={22} badge={false} />
                  <span className="truncate">{clean(s.name)}</span>
                </span>
                <span className="text-right tabular">
                  {s.w}-{s.l}
                </span>
                <span className="text-right text-muted-foreground tabular">{fmt(Math.round(s.pf))}</span>
              </Link>
            );
          })}
        </Block>

        <Block icon={BarChart3} title="სეზონის ლიდერები" to="/stats" link="სტატისტიკა" className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {leaders.map((p, i) => (
              <Link key={p.pid} to={`/player/${p.pid}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-2.5 transition-colors hover:border-white/20">
                <span className={cn("w-4 text-center text-xs tabular", i === 0 ? "text-gold" : "text-muted-foreground")}>{i + 1}</span>
                <PlayerPhoto pid={p.pid} className="h-10 w-10 shrink-0 rounded-full bg-muted object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <TeamAvatar name={p.owner} size={14} badge={false} />
                    <span className="truncate">{clean(p.owner)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold tabular">{fmt(p.total ?? 0)}</div>
                  <div className="text-[10px] text-muted-foreground tabular">{p.gp ? `${p.avg} × ${p.gp}` : "ქულა"}</div>
                </div>
              </Link>
            ))}
          </div>
        </Block>

        <Block icon={ActivityIcon} title="ბოლო აქტივობა" to="/trades" link="ტრეიდები" className="lg:col-span-5">
          <Activity />
        </Block>
      </div>
    </section>
  );
}

/** ჰეროში, თუ "ჩემი გუნდი" არჩეულია: ჩემი ამ კვირის მატჩი ტაბლოს სტილში */
export function MyMatch({ tid }: { tid: number }) {
  const data = useData();
  const me = data.managers.find((m) => m.tid === tid);
  const week = data.projections?.week ?? data.current.week;
  const g = me && data.current.schedule.find((x) => x.p === week && (key(x.h) === key(me.team) || key(x.a) === key(me.team)));
  if (!me || !g) return null;
  const opp = key(g.h) === key(me.team) ? g.a : g.h;
  const pj = (n: string) => Object.entries(data.projections?.teams ?? {}).find(([k]) => key(k) === key(n))?.[1];
  const a = pj(me.team);
  const b = pj(opp);
  const p = projectedWin(data, me.team, opp) ?? 0.5;
  const row = (name: string, score: number, win: number, color: string, lead: boolean, label: string) => (
    <div className="flex items-center gap-3">
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: `hsl(var(${color}))`, opacity: lead ? 1 : 0.35 }} />
      <TeamAvatar name={name} size={38} badge={false} />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[15px]", lead ? "font-semibold" : "text-muted-foreground")}>{clean(name)}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
      <div className="text-right">
        <div className={cn("text-3xl font-semibold leading-none tabular", !lead && "text-muted-foreground")}>{fmt(Math.round(score))}</div>
        <div className="mt-1 text-[11px] text-muted-foreground tabular">{Math.round(win * 100)}%</div>
      </div>
    </div>
  );
  return (
    <Link to="/live" className="block space-y-4 rounded-2xl border border-white/[0.12] bg-card p-5 transition-colors hover:border-white/25">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--red))]" /> შენი მატჩი · კვირა {week}
        </span>
        <span className="text-xs text-muted-foreground">Live →</span>
      </div>
      {row(me.team, a?.so_far ?? 0, p, "--red", (a?.so_far ?? 0) >= (b?.so_far ?? 0), a ? `${a.games_left} თამაში დარჩა` : "")}
      {row(opp, b?.so_far ?? 0, 1 - p, "--blue", (b?.so_far ?? 0) >= (a?.so_far ?? 0), b ? `${b.games_left} თამაში დარჩა` : "")}
      <div className="space-y-1">
        <div className="flex h-1 overflow-hidden rounded-full bg-white/10">
          <div className="bg-[hsl(var(--red))]" style={{ width: `${p * 100}%` }} />
          <div className="w-0.5 bg-card" />
          <div className="flex-1 bg-[hsl(var(--blue))]" />
        </div>
        <div className="text-right text-[10px] text-muted-foreground tabular">
          პროგნოზი {a ? fmt(Math.round(a.final)) : "-"} : {b ? fmt(Math.round(b.final)) : "-"}
        </div>
      </div>
    </Link>
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
    <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-card p-5">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--red))]" /> კვირა {week}
        </span>
        <Link to="/live" className="text-xs text-muted-foreground hover:text-foreground">
          Live →
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <TeamAvatar name={leader} size={52} />
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">კვირის ლიდერი</div>
          <div className="truncate text-lg font-semibold">{clean(leader)}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-semibold tabular">{fmt(Math.round(t.so_far))}</div>
          <div className="text-[11px] text-muted-foreground tabular">პროგნოზი {fmt(Math.round(t.final))}</div>
        </div>
      </div>
      {top && (top.total ?? 0) > 0 && (
        <Link to={`/player/${top.pid}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-2.5 transition-colors hover:border-white/20">
          <PlayerPhoto pid={top.pid} className="h-11 w-11 rounded-full bg-muted object-cover" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-muted-foreground">სეზონის საუკეთესო</div>
            <div className="truncate text-sm font-medium">{top.name}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold tabular">{fmt(top.total ?? 0)}</div>
            <div className="text-[10px] text-muted-foreground">{clean(top.owner).slice(0, 16)}</div>
          </div>
        </Link>
      )}
    </div>
  );
}
