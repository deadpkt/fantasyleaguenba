import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Dices, Minus, TrendingUp } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { key, playoffOdds, powerRankings } from "@/lib/season";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";

function Move({ prev, rank }: { prev: number | null; rank: number }) {
  if (prev == null) return <Minus className="h-3.5 w-3.5 text-muted-foreground/50" />;
  const d = prev - rank;
  if (!d) return <Minus className="h-3.5 w-3.5 text-muted-foreground/60" />;
  return (
    <span className={cn("flex items-center text-xs font-semibold tabular", d > 0 ? "text-win" : "text-loss")}>
      {d > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
      {Math.abs(d)}
    </span>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 60},${20 - ((v - min) / Math.max(1, max - min)) * 18}`).join(" ");
  return (
    <svg viewBox="0 0 60 22" className="h-6 w-16" aria-hidden>
      <polyline points={pts} fill="none" stroke="hsl(var(--blue))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const pct = (x: number) => (x >= 0.995 ? ">99%" : x > 0 && x < 0.005 ? "<1%" : `${Math.round(x * 100)}%`);

export default function Power() {
  const data = useData();
  const { week, rows } = useMemo(() => powerRankings(data), [data]);
  const odds = useMemo(() => playoffOdds(data), [data]);
  const tidOf = (name: string) => data.managers.find((m) => key(m.team) === key(name))?.tid;

  return (
    <>
      <PageHeader
        title="რეიტინგი"
        description={
          week
            ? `Power Rankings კვირა ${week}-ის შემდეგ: მოგებები, PPG და ბოლო 3 კვირის ფორმა. პლეიოფის შანსები 6 000 სიმულაციით ითვლება.`
            : "ეს სეზონამდე რეიტინგია, გასული სეზონის მიხედვით. სეზონის დაწყების მერე ყოველ კვირას განახლდება."
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        {/* Power Rankings */}
        <div className="space-y-2">
          {rows.map((r, i) => {
            const tid = tidOf(r.name);
            return (
              <Link key={r.name} to={tid ? `/team/${tid}` : "/managers"} className="block">
                <Card className="tone-card lift p-3 sm:p-4" style={tone(i === 0 ? "gold" : i < 3 ? "blue" : "red")}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex w-9 flex-col items-center">
                      <span className={cn("text-2xl font-extrabold tabular leading-none", i === 0 ? "text-gold" : "text-foreground/90")}>{r.rank}</span>
                      <Move prev={r.prev} rank={r.rank} />
                    </div>
                    <TeamAvatar name={r.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold">{clean(r.name)}</span>
                        {week > 0 && (
                          <span className="text-xs text-muted-foreground tabular">
                            {r.w}-{r.l} · {fmt(r.ppg)} PPG
                          </span>
                        )}
                        {r.streak && Number(r.streak.slice(1)) >= 2 && (
                          <Badge variant={r.streak[0] === "W" ? "win" : "loss"} className="px-1.5 py-0 text-[10px]">
                            {r.streak}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{r.note}</p>
                    </div>
                    <Spark values={r.last} />
                    <div className="hidden w-12 text-right sm:block">
                      <div className="text-lg font-bold tabular">{r.score}</div>
                      <div className="text-[10px] text-muted-foreground">ქულა</div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* პლეიოფის შანსები */}
        <Card className="lg:sticky lg:top-24">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dices className="h-4 w-4 text-orange-300" /> პლეიოფის შანსები
            </CardTitle>
            <CardDescription>
              {data.settings?.playoff_teams ?? 4} გუნდი გადის პლეიოფში. სიმულაცია ითვალისწინებს დარჩენილ კალენდარს და თითო გუნდის ფორმას.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_52px_52px_52px] gap-x-2 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>გუნდი</span>
              <span className="text-right">პლეიოფი</span>
              <span className="text-right">ფინალი</span>
              <span className="text-right">ტიტული</span>
            </div>
            <div className="space-y-1">
              {odds.map((o) => (
                <div key={o.name} className="grid grid-cols-[1fr_52px_52px_52px] items-center gap-x-2 rounded-lg py-1.5">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <TeamAvatar name={o.name} size={22} badge={false} />
                    <span className="truncate">{clean(o.name)}</span>
                  </div>
                  {[o.playoffs, o.final, o.title].map((v, k) => (
                    <div key={k} className="relative h-7 overflow-hidden rounded-md bg-white/[0.04]">
                      <div
                        className={cn("bar-fill absolute inset-y-0 left-0 origin-left", k === 2 ? "bg-amber-400/35" : k === 1 ? "bg-[hsl(var(--blue))]/30" : "bg-win/25")}
                        style={{ width: `${v * 100}%` }}
                      />
                      <span className="relative grid h-full place-items-center text-xs font-semibold tabular">{pct(v)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> რიცხვები ყოველ ჯერზე ოდნავ იცვლება, რადგან სიმულაციაა.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
