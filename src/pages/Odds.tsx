import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Crown, Dices, Medal, Minus, Trophy } from "lucide-react";
import { useData } from "@/lib/league";
import { clean } from "@/lib/format";
import { key, playoffOdds } from "@/lib/season";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import ShareButton from "@/components/league/ShareButton";

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
/** ანალიტიკის ჩანართი: სეზონის შანსები (პლეი-ოფი, ფინალი, ჩემპიონობა) */
export default function SeasonOdds() {
  const data = useData();
  const odds = useMemo(() => playoffOdds(data), [data]);
  const teamIds = useMemo(() => new Map(data.managers.map((m) => [key(m.team), m.tid])), [data.managers]);
  const playoffTeams = data.settings?.playoff_teams ?? 4;
  const managerOf = (name: string) => data.managers.find((m) => key(m.team) === key(name));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">სეზონის შანსები</h2>
        <ShareButton
          title={`WCF შანსები · ${data.current.label}`}
          text={odds
            .slice(0, 3)
            .map((o, i) => `${i + 1}. ${clean(o.name)}: ჩემპიონობა ${pct(o.title)}`)
            .join("\n")}
        />
      </div>

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
