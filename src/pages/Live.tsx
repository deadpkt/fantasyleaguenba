import { useState } from "react";
import { ChevronDown, Radio, RefreshCw } from "lucide-react";
import type { LiveData, LivePlayer, LiveTeam } from "@/types";
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

const pts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function PlayerLine({ p }: { p: LivePlayer }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="w-7 shrink-0 font-mono text-[10px] text-muted-foreground">{p.slot}</span>
      <PlayerPhoto pid={p.pid} className="h-7 w-7 shrink-0 rounded-full border bg-muted" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{p.name}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {p.pro}
          {p.opp && <span>vs {p.opp}</span>}
          {p.injury && <Badge variant="loss" className="px-1 py-0 text-[10px]">{p.injury.replace(/_/g, " ")}</Badge>}
        </div>
      </div>
      <span className={cn("w-10 text-right text-sm font-semibold tabular", p.points > 0 ? "text-foreground" : "text-muted-foreground")}>{pts(p.points)}</span>
    </div>
  );
}

function Lineup({ t }: { t: LiveTeam }) {
  if (!t.starters.length && !t.bench.length) return <p className="py-2 text-xs text-muted-foreground">როსტერი დრაფტის შემდეგ გამოჩნდება.</p>;
  return (
    <div>
      <div className="divide-y divide-white/5">
        {t.starters.map((p) => (
          <PlayerLine key={p.pid} p={p} />
        ))}
      </div>
      {t.bench.length > 0 && (
        <div className="mt-2 border-t border-dashed border-white/10 pt-1 opacity-60">
          {t.bench.map((p) => (
            <PlayerLine key={p.pid} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Matchup({ away, home, isPoints }: { away: LiveTeam; home: LiveTeam; isPoints: boolean }) {
  const [open, setOpen] = useState(false);
  const awayWin = winProb(away, home);
  const lead = away.score === home.score ? null : away.score > home.score ? "away" : "home";

  const Side = ({ t, side }: { t: LiveTeam; side: "away" | "home" }) => (
    <div className={cn("flex min-w-0 flex-1 items-center gap-3", side === "home" && "flex-row-reverse text-right")}>
      <TeamAvatar name={t.name} size={44} />
      <div className="min-w-0">
        <div className={cn("truncate text-sm font-medium", lead === side ? "text-foreground" : "text-muted-foreground")}>{clean(t.name)}</div>
        {t.projected != null && <div className="text-[11px] text-muted-foreground">პროგნოზი {pts(t.projected)}</div>}
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Side t={away} side="away" />
          <div className="flex shrink-0 items-baseline gap-2 text-2xl font-bold tabular sm:text-3xl">
            <span className={lead === "away" ? "text-foreground" : "text-muted-foreground"}>{pts(away.score)}</span>
            <span className="text-base text-muted-foreground">:</span>
            <span className={lead === "home" ? "text-foreground" : "text-muted-foreground"}>{pts(home.score)}</span>
          </div>
          <Side t={home} side="home" />
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

        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setOpen(!open)}>
          {open ? "დამალე" : isPoints ? "მოთამაშეების ქულები" : "როსტერები"}
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
        </Button>
        {open && (
          <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">{clean(away.name)}</div>
              <Lineup t={away} />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">{clean(home.name)}</div>
              <Lineup t={home} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Live() {
  const { state, reload } = useApi<LiveData>("/api/live", 60_000);

  return (
    <>
      <PageHeader
        title="Live მატჩაფები"
        description={state.status === "ready" ? `კვირა ${state.data.period} · ანგარიში ახლდება ავტომატურად ყოველ წუთში` : "ამ კვირის მატჩაფები ლაივ ანგარიშით"}
      >
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-1.5">
            <Radio className="h-3 w-3 animate-pulse motion-reduce:animate-none" /> LIVE
          </Badge>
          <Button variant="outline" size="sm" onClick={reload} className="bg-transparent">
            <RefreshCw /> განახლება
          </Button>
        </div>
      </PageHeader>

      {state.status === "loading" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}
      {state.status === "error" && <p className="text-sm text-loss">ვერ ჩაიტვირთა: {state.message}</p>}
      {state.status === "ready" && (
        <>
          {!state.data.drafted && (
            <p className="mb-4 rounded-lg border border-dashed border-white/15 p-3 text-sm text-muted-foreground">
              დრაფტი ჯერ არ ჩატარებულა. ქვემოთ პირველი კვირის მატჩაფებია. სეზონის დაწყების შემდეგ აქ ლაივ ანგარიში იქნება.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {state.data.matchups.map((m, i) => (
              <Matchup key={i} away={m.away} home={m.home} isPoints={state.data.is_points} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
