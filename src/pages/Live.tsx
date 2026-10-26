import { forwardRef, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Radio, RefreshCw } from "lucide-react";
import type { LiveData, LiveDay, LivePlayer, LiveTeam, StatLine } from "@/types";
import { useApi } from "@/lib/useApi";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { winProb } from "@/lib/season";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import Updated from "@/components/league/Updated";
import { normalizeLive } from "@/lib/normalize";
import { useMyTeam } from "@/lib/myTeam";
import { TeamCalendar, WeekPlanner } from "@/components/league/WeekSchedule";
import { LiveNow } from "@/components/league/LiveStrip";

const pts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const tbilisi = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tbilisi" });
type View = "today" | "week" | "plan";

/* ── მოთამაშის ბარათები: სტატუსის მიხედვით დაჯგუფებული ── */
const value = (p: LivePlayer, view: View) => (view === "today" ? p.today : p.points);

/** სტატისტიკა პატარა "ჩიპებად": ძირითადი სამი ყოველთვის, დანარჩენი მხოლოდ თუ 0 არ არის */
function Chips({ s }: { s: StatLine }) {
  const list: [string, string][] = [
    ["PTS", `${s.PTS}`],
    ["REB", `${s.REB}`],
    ["AST", `${s.AST}`],
  ];
  if (s.STL) list.push(["STL", `${s.STL}`]);
  if (s.BLK) list.push(["BLK", `${s.BLK}`]);
  if (s["3PM"]) list.push(["3PM", `${s["3PM"]}`]);
  if (s.TO) list.push(["TO", `${s.TO}`]);
  list.push(["FG", `${s.FGM}/${s.FGA}`]);
  return (
    <div className="flex flex-wrap gap-1">
      {list.map(([k, v]) => (
        <span key={k} className="inline-flex items-baseline gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] tabular">
          <span className="font-semibold text-foreground">{v}</span>
          <span className="text-[9px] text-muted-foreground">{k}</span>
        </span>
      ))}
    </div>
  );
}

function PlayerCard({ p, view }: { p: LivePlayer; view: View }) {
  const v = value(p, view);
  const line = view === "today" ? p.today_line : p.week_line;
  const live = view === "today" && p.status === "live";
  // რამდენად კარგად თამაშობს: დღეს = მის ჩვეულ საშუალოსთან, კვირა = საშუალო × ნათამაშები
  const base = view === "today" ? p.per_game : p.per_game * Math.max(1, p.week_games - p.week_left);
  const share = base > 0 ? Math.min(1.5, v / base) : 0;
  const played = (line?.MIN ?? 0) > 0;
  let info: React.ReactNode;
  if (view === "week") info = p.week_left > 0 ? `${p.week_left} თამაში დარჩა` : "კვირა დაასრულა";
  else if (live) info = <span className="font-medium text-[hsl(var(--red))]">LIVE · {line?.MIN ?? 0}'</span>;
  else if (p.status === "final") info = `დასრულდა · ${line?.MIN ?? 0}'`;
  else if (p.status === "upcoming") info = <span className="text-[hsl(var(--blue))]">{p.tip ? tbilisi(p.tip) : "დღეს"}</span>;
  else info = "დღეს არ თამაშობს";

  return (
    <div className={cn("flex gap-3 rounded-xl border p-3 transition-colors", live ? "border-[hsl(var(--red))]/40 bg-[hsl(var(--red))]/[0.05]" : "border-white/[0.06] bg-white/[0.02]")}>
      <div className="relative shrink-0 self-start">
        <PlayerPhoto pid={p.pid} className="h-12 w-12 rounded-full bg-muted object-cover" />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-zinc-800 px-1 font-mono text-[9px] leading-4 text-muted-foreground">{p.slot}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link to={`/player/${p.pid}`} className="truncate text-sm font-semibold hover:underline">
                {p.name}
              </Link>
              {p.injury && <span className="shrink-0 rounded bg-loss/15 px-1 text-[9px] font-semibold text-loss">{p.injury === "DAY_TO_DAY" ? "DTD" : p.injury.replace(/_/g, " ")}</span>}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {p.pro}
              {p.opp && view === "today" ? ` vs ${p.opp}` : ""} · {info}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className={cn("text-xl font-semibold leading-none tabular", v > 0 ? "text-foreground" : "text-muted-foreground/50")}>{pts(v)}</div>
            {base > 0 && (played || view === "week") && (
              <div className="mt-1.5 h-1 w-12 overflow-hidden rounded-full bg-white/10" title={`ჩვეულ საშუალოსთან: ${Math.round(share * 100)}%`}>
                <div className={cn("h-full rounded-full", share >= 1 ? "bg-win" : "bg-white/40")} style={{ width: `${Math.min(100, share * 100)}%` }} />
              </div>
            )}
          </div>
        </div>
        {line && played && <Chips s={line} />}
      </div>
    </div>
  );
}

function Group({ title, list, view, dim }: { title: string; list: LivePlayer[]; view: View; dim?: boolean }) {
  if (!list.length) return null;
  return (
    <div className={cn("space-y-2", dim && "opacity-60")}>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {title} <span className="tabular">{list.length}</span>
        <span className="h-px flex-1 bg-white/[0.06]" />
      </div>
      {list.map((p) => (
        <PlayerCard key={p.pid} p={p} view={view} />
      ))}
    </div>
  );
}

function TeamPanel({ t, view }: { t: LiveTeam; view: View }) {
  const [bench, setBench] = useState(false);
  if (!t.starters.length && !t.bench.length) return <p className="py-2 text-xs text-muted-foreground">როსტერი დრაფტის შემდეგ გამოჩნდება.</p>;
  const sorted = [...t.starters].sort((x, y) => value(y, view) - value(x, view));
  const benchList = [...t.bench].sort((x, y) => value(y, view) - value(x, view));
  return (
    <div className="space-y-4">
      {view === "today" ? (
        <>
          <Group title="ახლა თამაშობს" list={sorted.filter((p) => p.status === "live")} view={view} />
          <Group title="დასრულდა" list={sorted.filter((p) => p.status === "final")} view={view} />
          <Group title="ჯერ არ დაწყებულა" list={sorted.filter((p) => p.status === "upcoming")} view={view} />
          <Group title="დღეს არ თამაშობს" list={sorted.filter((p) => p.status === "none")} view={view} dim />
        </>
      ) : (
        <Group title="სასტარტო" list={sorted} view={view} />
      )}
      {benchList.length > 0 && (
        <div className="space-y-2">
          <button type="button" onClick={() => setBench(!bench)} className="flex w-full items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground">
            სათადარიგო <span className="tabular">{benchList.length}</span>
            <span className="h-px flex-1 bg-white/[0.06]" />
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", bench && "rotate-180")} />
          </button>
          {bench && (
            <div className="space-y-2 opacity-60">
              {benchList.map((p) => (
                <PlayerCard key={p.pid} p={p} view={view} />
              ))}
            </div>
          )}
        </div>
      )}
      {view === "week" && (t.departed?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-dashed border-white/10 p-3 text-xs text-muted-foreground">
          <div className="pb-1 text-[10px]">წავიდა, ქულა გუნდს რჩება</div>
          {t.departed!.map((p) => (
            <div key={p.pid} className="flex justify-between">
              <span>{p.name}</span>
              <span className="tabular">{pts(p.points)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** ტელეფონზე: ერთი გუნდი ერთდროულად (გადამრთველით); კომპიუტერზე: ორივე გვერდიგვერდ */
function Rosters({ away, home, view }: { away: LiveTeam; home: LiveTeam; view: View }) {
  const myTid = useMyTeam();
  const [pick, setPick] = useState<0 | 1>(home.tid != null && home.tid === myTid ? 1 : 0);
  const teams = [away, home];
  const total = (t: LiveTeam) => pts(view === "today" ? t.today : t.score);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 md:hidden">
        {teams.map((t, i) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setPick(i as 0 | 1)}
            className={cn("flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs transition-colors", pick === i ? "bg-white text-black" : "text-muted-foreground")}
          >
            <span className="truncate font-medium">{clean(t.name)}</span>
            <span className="shrink-0 font-semibold tabular">{total(t)}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {teams.map((t, i) => (
          <div key={t.name} className={cn(pick !== i && "hidden md:block")}>
            <div className="mb-3 hidden items-baseline justify-between md:flex">
              <span className="truncate text-sm font-medium">{clean(t.name)}</span>
              <span className="text-sm tabular text-muted-foreground">
                <b className="text-foreground">{total(t)}</b> {view === "today" ? "დღეს" : "კვირაში"}
              </span>
            </div>
            <TeamPanel t={t} view={view} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** ტაბლოს ერთი ხაზი: გუნდი, დღევანდელი/დარჩენილი, ახლა მოედანზე მყოფები, ანგარიში */
function TeamRow({ t, lead, win, color }: { t: LiveTeam; lead: boolean; win: number; color: string }) {
  const onCourt = t.starters.filter((p) => p.status === "live");
  return (
    <div className="flex items-center gap-3">
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: `hsl(var(${color}))`, opacity: lead ? 1 : 0.35 }} />
      <TeamAvatar name={t.name} size={40} badge={false} />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[15px] font-semibold", !lead && "text-muted-foreground")}>{clean(t.name)}</div>
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-[11px] text-muted-foreground tabular">
          {t.today > 0 && <span className="text-win">+{pts(t.today)} დღეს</span>}
          {(t.games_left ?? 0) > 0 && <span>{t.games_left} თამ. დარჩა</span>}
          {onCourt.length > 0 && (
            <span className="flex items-center">
              {onCourt.slice(0, 3).map((p, i) => (
                <span key={p.pid} className={cn("h-5 w-5 overflow-hidden rounded-full border border-[hsl(var(--red))] bg-muted", i > 0 && "-ml-1.5")}>
                  <PlayerPhoto pid={p.pid} className="h-full w-full" />
                </span>
              ))}
              {onCourt.length > 3 && <span className="ml-1 text-[hsl(var(--red))]">+{onCourt.length - 3}</span>}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={cn("text-3xl font-semibold leading-none tabular", !lead && "text-muted-foreground")}>{pts(t.score)}</div>
        <div className="mt-1 text-[11px] text-muted-foreground tabular">{Math.round(win * 100)}%</div>
      </div>
    </div>
  );
}

type MatchupProps = { away: LiveTeam; home: LiveTeam; days: LiveDay[]; isPoints: boolean; open: boolean; onToggle: () => void; mine?: boolean; className?: string };

const Matchup = forwardRef<HTMLDivElement, MatchupProps>(function Matchup({ away, home, days, isPoints, open, onToggle, mine, className }, ref) {
  const [view, setView] = useState<View>("today");
  const awayWin = away.win ?? winProb(away, home);
  const live = [...away.starters, ...home.starters].filter((p) => p.status === "live").length;
  const diff = Math.abs(away.score - home.score);

  return (
    <Card ref={ref} className={cn("scroll-mt-24 overflow-hidden transition-colors", open && "lg:col-span-2", live > 0 && !open && "border-[hsl(var(--red))]/25", mine && "border-white/30", className)}>
      <CardContent className="p-0">
        <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full space-y-3 p-4 text-left sm:p-5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            {mine && <span className="mr-auto pr-2 font-semibold text-foreground">შენი მატჩი ·</span>}
            {live > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[hsl(var(--red))]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--red))]" /> LIVE · {live} თამაშობს
              </span>
            ) : (
              <span>{diff > 0 ? `სხვაობა ${pts(diff)}` : "თანაბრადაა"}</span>
            )}
            <span className="flex items-center gap-1">
              {open ? "დაკეცვა" : isPoints ? "მოთამაშეები" : "როსტერები"}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} />
            </span>
          </div>
          <TeamRow t={away} lead={away.score >= home.score} win={awayWin} color="--red" />
          <TeamRow t={home} lead={home.score >= away.score} win={1 - awayWin} color="--blue" />
          <div className="space-y-1 pt-1">
            <div className="flex h-1 overflow-hidden rounded-full bg-white/10">
              <div className="bg-[hsl(var(--red))] transition-all duration-700" style={{ width: `${awayWin * 100}%` }} />
              <div className="w-0.5 bg-card" />
              <div className="flex-1 bg-[hsl(var(--blue))]" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground tabular">
              <span>მოგების შანსი</span>
              {away.projected != null && home.projected != null && (
                <span>
                  პროგნოზი {Math.round(away.projected)} : {Math.round(home.projected)}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* რბილად იხსნება (grid-rows 0fr → 1fr) */}
        <div className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-4 border-t border-white/[0.08] p-4 sm:p-5">
              <div className="flex justify-center">
                <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                  {(
                    [
                      ["today", "დღეს"],
                      ["week", "მთელი კვირა"],
                      ["plan", "განრიგი"],
                    ] as const
                  )
                    .filter(([v]) => v !== "plan" || days.length > 0)
                    .map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        className={cn("rounded-full px-3.5 py-1 text-xs transition-colors", view === v ? "bg-white text-black" : "text-muted-foreground hover:text-foreground")}
                      >
                        {l}
                      </button>
                    ))}
                </div>
              </div>
              {view === "plan" ? (
                <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                  {[away, home].map((t) => (
                    <div key={t.name}>
                      <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>{clean(t.name)}</span>
                        <span className="tabular">{t.games_left ?? 0} თამაში დარჩა</span>
                      </div>
                      <TeamCalendar t={t} days={days} />
                    </div>
                  ))}
                </div>
              ) : (
                <Rosters away={away} home={home} view={view} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default function Live() {
  const { state, reload } = useApi<LiveData>("/api/live", 30_000);
  const data = state.status === "ready" ? normalizeLive(state.data) : null;
  const myTid = useMyTeam();
  const isMine = (m: { home: LiveTeam; away: LiveTeam }) => myTid != null && (m.home.tid === myTid || m.away.tid === myTid);
  const matchups = data ? [...data.matchups].sort((x, y) => Number(isMine(y)) - Number(isMine(x))) : [];
  const anyLive = !!data?.matchups.some((m) => [...m.home.starters, ...m.away.starters].some((p) => p.status === "live"));

  // ერთი მატჩაფის გახსნისას დანარჩენები იმალება; ზემოთ ასქროლვისას ყველა ბრუნდება
  const [focus, setFocus] = useState<number | null>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const openedAt = useRef(0);
  useEffect(() => {
    if (focus == null) return;
    openedAt.current = Date.now();
    requestAnimationFrame(() => {
      const el = cards.current[focus];
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
    });
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const up = y < lastY;
      lastY = y;
      if (Date.now() - openedAt.current < 1000 || !up) return; // ჯერ ავტომატური სქროლი მიდის
      const el = cards.current[focus];
      if (el && el.getBoundingClientRect().top > 160) setFocus(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [focus]);

  return (
    <>
      <PageHeader title="Live მატჩაფები" description={data ? `კვირა ${data.period}. ანგარიში თავისით ახლდება ყოველ 30 წამში.` : "ამ კვირის მატჩაფები ლაივ ანგარიშით"}>
        <div className="flex items-center gap-3">
          {data && <Updated at={data.updated} />}
          {anyLive && (
            <Badge variant="destructive" className="gap-1.5">
              <Radio className="h-3 w-3 animate-pulse motion-reduce:animate-none" /> LIVE
            </Badge>
          )}
          <Button variant="outline" size="icon" onClick={reload} className="h-8 w-8 rounded-full bg-transparent" aria-label="განახლება">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PageHeader>

      {state.status === "loading" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}
      {state.status === "error" && <p className="text-sm text-loss">ვერ ჩაიტვირთა: {state.message}</p>}
      {data && (
        <>
          {!data.drafted && (
            <p className="mb-4 rounded-lg border border-dashed border-white/15 p-3 text-sm text-muted-foreground">
              დრაფტი ჯერ არ ჩატარებულა. ქვემოთ პირველი კვირის მატჩაფებია. სეზონის დაწყების შემდეგ აქ ლაივ ანგარიში იქნება.
            </p>
          )}
          <LiveNow data={data} />
          <WeekPlanner data={data} />
          <div className="mb-3 mt-6 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">მატჩაფები</h2>
            <span className="hidden text-xs text-muted-foreground sm:inline">დააჭირე მატჩს მოთამაშეებისთვის</span>
          </div>
          <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
            {matchups.map((m, i) => (
              <Matchup
                // დამალულები დაბრუნებისას თავიდან "შემოდიან" (pass-in ანიმაცია)
                key={focus === i ? i : `${i}-${focus === null}`}
                ref={(el) => (cards.current[i] = el)}
                away={m.away}
                home={m.home}
                days={data.days ?? []}
                isPoints={data.is_points}
                open={focus === i}
                onToggle={() => setFocus(focus === i ? null : i)}
                mine={isMine(m)}
                className={cn(focus !== null && focus !== i && "hidden", focus === null && "pass-in")}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
