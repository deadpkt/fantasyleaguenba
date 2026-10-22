import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Crown, Dices, Medal, Minus, Trophy } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { key, playoffOdds, projectedWin } from "@/lib/season";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import ShareButton from "@/components/league/ShareButton";
import Updated from "@/components/league/Updated";

const pct = (value: number) => (value >= 0.995 ? ">99%" : value > 0 && value < 0.005 ? "<1%" : `${Math.round(value * 100)}%`);

function Form({ trend }: { trend: number }) {
  if (trend > 0.04) {
    return (
      <span className="inline-flex items-center gap-1 text-win">
        <ArrowUpRight className="h-3.5 w-3.5" /> აღმასვლა
      </span>
    );
  }
  if (trend < -0.04) {
    return (
      <span className="inline-flex items-center gap-1 text-loss">
        <ArrowDownRight className="h-3.5 w-3.5" /> დაღმასვლა
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Minus className="h-3.5 w-3.5" /> სტაბილური
    </span>
  );
}

function Chance({ label, value, kind }: { label: string; value: number; kind: "playoff" | "final" | "title" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular">{pct(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700",
            kind === "title" ? "bg-amber-400" : kind === "final" ? "bg-[hsl(var(--blue))]" : "bg-win",
          )}
          style={{ width: `${Math.max(value * 100, value > 0 ? 1 : 0)}%` }}
        />
      </div>
    </div>
  );
}

/** ამ კვირის მატჩები: ქულა ახლა, პროგნოზი კვირის ბოლოსთვის და მოგების შანსი */
function WeekMatchups() {
  const data = useData();
  const pj = data.projections;
  if (!pj) return null;
  const games = data.current.schedule.filter((g) => g.p === pj.week);
  const team = (n: string) => Object.entries(pj.teams).find(([k]) => key(k) === key(n))?.[1];
  if (!games.length) return null;
  return (
    <section className="mb-8 space-y-3">
      <h2 className="text-lg font-semibold">კვირა {pj.week}: მატჩების შანსები</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {games.map((g) => {
          const h = team(g.h);
          const a = team(g.a);
          const p = projectedWin(data, g.h, g.a) ?? 0.5;
          return (
            <Card key={`${g.h}-${g.a}`} className="p-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                {[
                  [g.h, h, p],
                  [g.a, a, 1 - p],
                ].map(([n, t, pr], i) => (
                  <div key={n as string} className={cn("flex min-w-0 items-center gap-2", i === 1 && "order-3 flex-row-reverse text-right")}>
                    <TeamAvatar name={n as string} size={34} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{clean(n as string)}</div>
                      <div className="text-[11px] text-muted-foreground tabular">
                        {t ? `${fmt(Math.round((t as { so_far: number }).so_far))} → ${fmt(Math.round((t as { final: number }).final))}` : "-"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "ml-auto text-xl font-bold tabular",
                        i === 1 && "ml-0 mr-auto",
                        (pr as number) >= 0.5 ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {pct(pr as number)}
                    </div>
                  </div>
                ))}
                <span className="order-2 text-[11px] text-muted-foreground">VS</span>
              </div>
              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="bg-[hsl(var(--red))] transition-all duration-700" style={{ width: `${p * 100}%` }} />
                <div className="flex-1 bg-[hsl(var(--blue))]" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>{h ? `${h.games_left} თამაში დარჩა` : ""}</span>
                <span>{a ? `${a.games_left} თამაში დარჩა` : ""}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default function Odds() {
  const data = useData();
  const odds = useMemo(() => playoffOdds(data), [data]);
  const teamIds = useMemo(() => new Map(data.managers.map((m) => [key(m.team), m.tid])), [data.managers]);
  const playoffTeams = data.settings?.playoff_teams ?? 4;
  const managerOf = (name: string) => data.managers.find((m) => key(m.team) === key(name));

  return (
    <>
      <PageHeader
        title={`შანსები · ${data.current.label}`}
        description={`${data.current.label}: ვინ გავა პლეი-ოფში, ფინალში და ვის აქვს ჩემპიონობის საუკეთესო შანსი. ითვლება დარჩენილი კალენდრის 6 000 სიმულაციით, თითო გუნდის მოთამაშეების მიხედვით.`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Updated at={data.updated_at} />
          <ShareButton
            title={`WCF შანსები · ${data.current.label}`}
            text={odds
              .slice(0, 3)
              .map((o, i) => `${i + 1}. ${clean(o.name)}: ჩემპიონობა ${pct(o.title)}`)
              .join("\n")}
          />
        </div>
      </PageHeader>

      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Dices className="h-4 w-4 text-orange-300" /> 6 000 სიმულაცია
          </span>
          <span className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-win" /> პლეი-ოფში გადის {playoffTeams} გუნდი
          </span>
          <span>ითვალისწინებს: მოთამაშის საშუალოს და ESPN-ის პროგნოზს, ტრავმებს, ვის რამდენი თამაში აქვს თითო კვირაში, 10 აქტიურ სლოტს</span>
        </CardContent>
      </Card>

      <WeekMatchups />

      <h2 className="mb-3 text-lg font-semibold">სეზონის შანსები</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {odds.map((row, index) => {
          const tid = teamIds.get(key(row.name));
          const stars = [...(managerOf(row.name)?.roster ?? [])].sort((a, b) => b.per_game - a.per_game).slice(0, 3);
          return (
            <Link key={row.name} to={tid ? `/team/${tid}` : "/managers"} className="block">
              <Card className="tone-card lift h-full" style={tone(index === 0 ? "gold" : index < playoffTeams ? "blue" : "red")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-lg font-bold tabular">{index + 1}</div>
                    <TeamAvatar name={row.name} size={42} />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">{clean(row.name)}</CardTitle>
                      <CardDescription className="mt-0.5">
                        {row.w}-{row.l} · სავარაუდო ადგილი {row.seed ? `#${row.seed.toFixed(1)}` : "-"}
                      </CardDescription>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                        <span>ძალა: {row.expected} ქულა/კვირა</span>
                        <Form trend={row.trend} />
                      </div>
                    </div>
                    {index === 0 && <Crown className="h-5 w-5 text-gold" aria-label="ჩემპიონობის ფავორიტი" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stars.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5">
                      <span className="text-[11px] text-muted-foreground">ლიდერები</span>
                      {stars.map((p) => (
                        <span key={p.pid} className="flex min-w-0 items-center gap-1 text-xs" title={`${p.name}: ${p.per_game} ქულა თამაშზე`}>
                          <PlayerPhoto pid={p.pid} className="h-6 w-6 shrink-0 rounded-full bg-muted object-cover" />
                          <span className="truncate">{p.name.split(" ").slice(-1)[0]}</span>
                          <span className="text-muted-foreground tabular">{Math.round(p.per_game)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <Chance label="პლეი-ოფი" value={row.playoffs} kind="playoff" />
                  <Chance label="ფინალი" value={row.final} kind="final" />
                  <Chance label="ჩემპიონობა" value={row.title} kind="title" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Trophy className="h-3.5 w-3.5" /> ალბათობები პროგნოზია და ყოველი ახალი შედეგის შემდეგ ავტომატურად გადაითვლება.
      </p>
    </>
  );
}
