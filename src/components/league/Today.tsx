import { Link } from "react-router-dom";
import { CalendarClock, Star } from "lucide-react";
import type { LiveData, LivePlayer } from "@/types";
import { useApi } from "@/lib/useApi";
import { normalizeLive } from "@/lib/normalize";
import { clean } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

type P = LivePlayer & { owner: string };
const pts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const tbilisi = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tbilisi" });
const last = (name: string) => name.split(" ").slice(-1)[0];

/** კვირის სამი საუკეთესო — კვარცხლბეკი (მეორე · პირველი · მესამე) */
function Podium({ players }: { players: P[] }) {
  const order = [players[1], players[0], players[2]].filter(Boolean);
  const place = (p: P) => players.indexOf(p) + 1;
  const style = {
    1: { h: "h-28", ring: "ring-amber-400/70", text: "text-gold", medal: "🥇" },
    2: { h: "h-20", ring: "ring-slate-300/60", text: "text-slate-200", medal: "🥈" },
    3: { h: "h-14", ring: "ring-orange-700/60", text: "text-orange-300", medal: "🥉" },
  } as const;
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5">
      {order.map((p) => {
        const n = place(p) as 1 | 2 | 3;
        const s = style[n];
        const line = p.week_line;
        return (
          <div key={p.pid} className="podium-in flex w-1/3 max-w-[150px] flex-col items-center text-center" style={{ animationDelay: `${(3 - n) * 120}ms` }}>
            <div className="relative">
              <PlayerPhoto pid={p.pid} className={cn("rounded-full bg-muted object-cover ring-2", s.ring, n === 1 ? "h-20 w-20" : "h-16 w-16")} />
              <span className="absolute -bottom-1 -right-1 text-lg">{s.medal}</span>
            </div>
            <div className="mt-2 w-full truncate text-sm font-semibold">{last(p.name)}</div>
            <div className="flex max-w-full items-center gap-1 text-[10px] text-muted-foreground">
              <TeamAvatar name={p.owner} size={12} badge={false} />
              <span className="truncate">{clean(p.owner)}</span>
            </div>
            {line && (
              <div className="mt-1 text-[10px] text-muted-foreground tabular">
                {line.PTS}p · {line.REB}r · {line.AST}a
              </div>
            )}
            <div className={cn("mt-2 flex w-full flex-col items-center justify-start rounded-t-lg border border-b-0 border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent pt-2", s.h)}>
              <span className={cn("text-xl font-extrabold tabular", s.text)}>{pts(p.points)}</span>
              <span className="text-[9px] text-muted-foreground">ქულა კვირაში</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Chip({ p }: { p: P }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border px-1.5 py-1", p.status === "live" ? "border-[hsl(var(--red))]/40 bg-[hsl(var(--red))]/[0.08]" : "border-white/10 bg-white/[0.03]")}>
      <PlayerPhoto pid={p.pid} className="h-7 w-7 shrink-0 rounded-full bg-muted object-cover" />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-xs font-medium">{last(p.name)}</div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <TeamAvatar name={p.owner} size={11} badge={false} />
          <span>vs {p.opp}</span>
        </div>
      </div>
      {p.status !== "upcoming" && <span className="ml-auto pl-1 text-xs font-bold tabular">{pts(p.today)}</span>}
    </div>
  );
}

/** დღევანდელი თამაშები: ვინ თამაშობს ახლა, ვინ რომელ საათზე, ვინ დაასრულა */
function Schedule({ players }: { players: P[] }) {
  const live = players.filter((p) => p.status === "live").sort((a, b) => b.today - a.today);
  const upcoming = players.filter((p) => p.status === "upcoming");
  const done = players.filter((p) => p.status === "final").sort((a, b) => b.today - a.today);
  const byTime = new Map<string, P[]>();
  for (const p of upcoming.sort((a, b) => (a.tip ?? "").localeCompare(b.tip ?? ""))) {
    const t = p.tip ? tbilisi(p.tip) : "დღეს";
    byTime.set(t, [...(byTime.get(t) ?? []), p]);
  }
  const groups: [string, P[], string][] = [
    ...(live.length ? ([["ახლა თამაშობს", live, "text-[hsl(var(--red))]"]] as [string, P[], string][]) : []),
    ...[...byTime].map(([t, ps]) => [t, ps, "text-[hsl(var(--blue))]"] as [string, P[], string]),
    ...(done.length ? ([["დასრულდა", done, "text-muted-foreground"]] as [string, P[], string][]) : []),
  ];
  if (!groups.length) return <p className="text-sm text-muted-foreground">დღეს ლიგის მოთამაშეებს თამაში არ აქვთ.</p>;
  return (
    <div className="space-y-3">
      {groups.map(([label, ps, color]) => (
        <div key={label} className="space-y-1.5">
          <div className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider", color)}>
            {label === "ახლა თამაშობს" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--red))]" />}
            {label}
            <span className="font-normal text-muted-foreground">· {ps.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {ps.slice(0, label === "დასრულდა" ? 6 : 12).map((p) => (
              <Chip key={p.pid} p={p} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Today() {
  const { state } = useApi<LiveData>("/api/live", 60_000);
  if (state.status === "loading")
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72 lg:col-span-3" />
      </div>
    );
  if (state.status !== "ready") return null;
  const data = normalizeLive(state.data);
  // მხოლოდ სასტარტოები — სათადარიგოს ქულა გუნდს არ ეთვლება
  const starters: P[] = data.matchups.flatMap((m) => [m.home, m.away]).flatMap((t) => t.starters.map((p) => ({ ...p, owner: t.name })));
  const top = [...starters].sort((a, b) => b.points - a.points).filter((p) => p.points > 0).slice(0, 3);
  if (!starters.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            დღეს
          </h2>
          <p className="text-sm text-muted-foreground">კვირის ვარსკვლავები და დღის თამაშები (თბილისის დროით).</p>
        </div>
        <Link to="/live" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Live →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="tone-card lift lg:col-span-2" style={tone("gold")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-gold" /> კვირა {data.period}: ვარსკვლავები
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">{top.length ? <Podium players={top} /> : <p className="text-sm text-muted-foreground">ჯერ არავის უთამაშია.</p>}</CardContent>
        </Card>
        <Card className="tone-card lift lg:col-span-3" style={tone("blue")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-[hsl(var(--blue))]" /> დღის თამაშები
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Schedule players={starters} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
