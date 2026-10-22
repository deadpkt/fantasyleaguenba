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
import { TeamCalendar, WeekPlanner } from "@/components/league/WeekSchedule";

const pts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const tbilisi = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tbilisi" });
type View = "today" | "week" | "plan";

/** "45 PTS · 7 REB · 6 AST · 17/25 FG · 32'" — ნულოვანებს (გარდა PTS/REB/AST) არ ვაჩვენებთ */
function Line({ s }: { s: StatLine }) {
  const parts: [string, string][] = [
    [`${s.PTS}`, "PTS"],
    [`${s.REB}`, "REB"],
    [`${s.AST}`, "AST"],
  ];
  if (s.STL) parts.push([`${s.STL}`, "STL"]);
  if (s.BLK) parts.push([`${s.BLK}`, "BLK"]);
  if (s["3PM"]) parts.push([`${s["3PM"]}`, "3PM"]);
  if (s.TO) parts.push([`${s.TO}`, "TO"]);
  parts.push([`${s.FGM}/${s.FGA}`, "FG"]);
  if (s.FTA) parts.push([`${s.FTM}/${s.FTA}`, "FT"]);
  if (s.MIN) parts.push([`${s.MIN}'`, ""]);
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] tabular text-muted-foreground">
      {parts.map(([v, l]) => (
        <span key={l || "min"}>
          <span className="text-foreground/85">{v}</span>
          {l && <span className="ml-0.5 text-[9px] uppercase">{l}</span>}
        </span>
      ))}
    </div>
  );
}

function Status({ p }: { p: LivePlayer }) {
  if (p.status === "live")
    return (
      <span className="inline-flex items-center gap-1 rounded bg-[hsl(var(--red))]/15 px-1 text-[10px] font-semibold text-[hsl(var(--red))]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--red))]" /> LIVE
      </span>
    );
  if (p.status === "final") return <span className="rounded bg-white/[0.06] px-1 text-[10px] text-muted-foreground">დასრულდა</span>;
  if (p.status === "upcoming") return <span className="rounded bg-[hsl(var(--blue))]/15 px-1 text-[10px] text-[hsl(var(--blue))]">{p.tip ? tbilisi(p.tip) : "დღეს"}</span>;
  return <span className="text-[10px] text-muted-foreground/60">დღეს არ თამაშობს</span>;
}

function PlayerRow({ p, view }: { p: LivePlayer; view: View }) {
  const line = view === "today" ? p.today_line : p.week_line;
  const value = view === "today" ? p.today : p.points;
  return (
    <div className={cn("flex items-center gap-2.5 py-2", p.status === "live" && view === "today" && "rounded-lg bg-[hsl(var(--red))]/[0.06] px-1.5")}>
      <span className="w-7 shrink-0 font-mono text-[10px] text-muted-foreground">{p.slot}</span>
      <PlayerPhoto pid={p.pid} className="h-9 w-9 shrink-0 rounded-full border bg-muted object-cover" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <Link to={`/player/${p.pid}`} className="truncate text-sm font-medium hover:underline">
            {p.name}
          </Link>
          {p.injury && (
            <Badge variant="loss" className="shrink-0 px-1 py-0 text-[9px]">
              {p.injury.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>
            {p.pro}
            {p.opp && view === "today" ? ` vs ${p.opp}` : ""}
          </span>
          {view === "today" ? <Status p={p} /> : <span>{p.week_left > 0 ? `${p.week_left} თამაში დარჩა` : "კვირა დაასრულა"}</span>}
        </div>
        {line && line.MIN > 0 && <Line s={line} />}
      </div>
      <div className="w-12 shrink-0 text-right">
        <div className={cn("text-base font-bold tabular", value > 0 ? "text-foreground" : "text-muted-foreground/60")}>{pts(value)}</div>
        <div className="text-[9px] text-muted-foreground">{view === "today" ? "დღეს" : "კვირა"}</div>
      </div>
    </div>
  );
}

function Lineup({ t, view }: { t: LiveTeam; view: View }) {
  if (!t.starters.length && !t.bench.length) return <p className="py-2 text-xs text-muted-foreground">როსტერი დრაფტის შემდეგ გამოჩნდება.</p>;
  return (
    <div>
      <div className="divide-y divide-white/5">
        {t.starters.map((p) => (
          <PlayerRow key={p.pid} p={p} view={view} />
        ))}
      </div>
      {t.bench.length > 0 && (
        <div className="mt-2 border-t border-dashed border-white/10 pt-1 opacity-60">
          <div className="pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">სათადარიგო</div>
          {t.bench.map((p) => (
            <PlayerRow key={p.pid} p={p} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}

function Side({ t, side, lead }: { t: LiveTeam; side: "away" | "home"; lead: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-2", side === "home" && "items-end text-right")}>
      <div className={cn("flex min-w-0 items-center gap-2.5", side === "home" && "flex-row-reverse")}>
        <TeamAvatar name={t.name} size={42} />
        <div className={cn("min-w-0 truncate text-sm font-medium", lead ? "text-foreground" : "text-muted-foreground")}>{clean(t.name)}</div>
      </div>
      <div className={cn("text-3xl font-extrabold tabular leading-none sm:text-4xl", lead ? "text-foreground" : "text-muted-foreground")}>{pts(t.score)}</div>
      <div className="space-y-0.5 text-[11px] text-muted-foreground tabular">
        {t.today > 0 && <div className="text-win">+{pts(t.today)} დღეს</div>}
        {t.projected != null && (
          <div>
            პროგნოზი <b className="text-foreground/90">{Math.round(t.projected)}</b>
          </div>
        )}
        {t.games_left != null && <div>{t.games_left} თამაში დარჩა</div>}
      </div>
    </div>
  );
}

type MatchupProps = { away: LiveTeam; home: LiveTeam; days: LiveDay[]; isPoints: boolean; open: boolean; onToggle: () => void; className?: string };

const Matchup = forwardRef<HTMLDivElement, MatchupProps>(function Matchup({ away, home, days, isPoints, open, onToggle, className }, ref) {
  const [view, setView] = useState<View>("today");
  const awayWin = away.win ?? winProb(away, home);
  const live = [...away.starters, ...home.starters].filter((p) => p.status === "live").length;

  return (
    <Card ref={ref} className={cn("scroll-mt-24 overflow-hidden transition-all duration-500", open && "lg:col-span-2", className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Side t={away} side="away" lead={away.score > home.score} />
          <div className="flex shrink-0 flex-col items-center gap-1 pt-12">
            <span className="text-xs text-muted-foreground">VS</span>
            {live > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[hsl(var(--red))]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--red))]" /> {live}
              </span>
            )}
          </div>
          <Side t={home} side="home" lead={home.score > away.score} />
        </div>

        {/* მოგების შანსი */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs tabular">
            <span className={cn("font-semibold", awayWin >= 0.5 ? "text-[hsl(var(--red))]" : "text-muted-foreground")}>{Math.round(awayWin * 100)}%</span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">მოგების შანსი</span>
            <span className={cn("font-semibold", awayWin < 0.5 ? "text-[hsl(var(--blue))]" : "text-muted-foreground")}>{Math.round((1 - awayWin) * 100)}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
            <div className="bg-gradient-to-r from-[hsl(var(--red))] to-[hsl(var(--red))]/70 transition-all duration-700" style={{ width: `${awayWin * 100}%` }} />
            <div className="w-0.5 bg-black" />
            <div className="flex-1 bg-gradient-to-l from-[hsl(var(--blue))] to-[hsl(var(--blue))]/70" />
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onToggle} aria-expanded={open}>
          {open ? "დამალე" : isPoints ? "მოთამაშეები და სტატისტიკა" : "როსტერები"}
          <ChevronDown className={cn("transition-transform duration-300", open && "rotate-180")} />
        </Button>

        {/* რბილად იხსნება (grid-rows 0fr → 1fr) */}
        <div className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-3 border-t border-white/10 pt-3">
              <div className="flex justify-center">
                <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
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
                      className={cn("rounded-md px-3 py-1 text-xs transition-colors", view === v ? "bg-white text-black" : "text-muted-foreground hover:text-foreground")}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                {[away, home].map((t) => (
                  <div key={t.name}>
                    <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{clean(t.name)}</span>
                      <span className="tabular">{view === "today" ? `${pts(t.today)} დღეს` : view === "week" ? `${pts(t.score)} კვირაში` : `${t.games_left ?? 0} თამაში დარჩა`}</span>
                    </div>
                    {view === "plan" ? <TeamCalendar t={t} days={days} /> : <Lineup t={t} view={view} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/** ვინ თამაშობს ახლა მთელ ლიგაში */
function LiveNow({ data }: { data: LiveData }) {
  const live = data.matchups
    .flatMap((m) => [m.home, m.away])
    .flatMap((t) => t.starters.filter((p) => p.status === "live").map((p) => ({ p, team: t.name })))
    .sort((a, b) => b.p.today - a.p.today);
  if (!live.length) return null;
  return (
    <Card className="mb-5 overflow-hidden">
      <div className="flex items-center gap-3 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[hsl(var(--red))] px-2 py-1 text-[11px] font-bold text-white">
          <Radio className="h-3 w-3 animate-pulse" /> ახლა თამაშობს
        </span>
        {live.map(({ p, team }) => (
          <span key={p.pid} className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-1 pl-1 pr-2.5">
            <PlayerPhoto pid={p.pid} className="h-7 w-7 rounded-full bg-muted object-cover" />
            <span className="text-xs">
              <span className="font-medium">{p.name.split(" ").slice(-1)[0]}</span>
              <span className="ml-1 text-muted-foreground">{clean(team).slice(0, 14)}</span>
            </span>
            <span className="text-sm font-bold tabular">{pts(p.today)}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

export default function Live() {
  const { state, reload } = useApi<LiveData>("/api/live", 30_000);
  const data = state.status === "ready" ? normalizeLive(state.data) : null;
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
      <PageHeader title="Live მატჩაფები" description={data ? `კვირა ${data.period}. ანგარიში ავტომატურად ახლდება ყოველ 30 წამში.` : "ამ კვირის მატჩაფები ლაივ ანგარიშით"}>
        <div className="flex flex-wrap items-center gap-3">
          {data && <Updated at={data.updated} />}
          {anyLive && (
            <Badge variant="destructive" className="gap-1.5">
              <Radio className="h-3 w-3 animate-pulse motion-reduce:animate-none" /> LIVE
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={reload} className="bg-transparent">
            <RefreshCw /> განახლება
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
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {data.matchups.map((m, i) => (
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
                className={cn(focus !== null && focus !== i && "hidden", focus === null && "pass-in")}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
