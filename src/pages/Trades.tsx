import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { useData } from "@/lib/league";
import { clean } from "@/lib/format";
import { tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function Trades() {
  const { trades, current } = useData();
  const cur = trades?.current ?? [];
  const past = trades?.past ?? [];

  return (
    <>
      <PageHeader title="ტრეიდები" description="ვინ ვის რა მისცა. მიმდინარე სეზონის ტრეიდები ESPN-იდან ავტომატურად ემატება." />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">სეზონი {current.label}</h2>
        {cur.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
              <ArrowLeftRight className="h-4 w-4" /> ამ სეზონში ჯერ ტრეიდი არ ყოფილა. პირველი ტრეიდი აქ ავტომატურად გამოჩნდება.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cur.map((t, i) => (
              <Card key={i} className="tone-card" style={tone("blue")}>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-[hsl(var(--blue))]" /> {day(t.date)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {t.sides.map((s) => (
                    <div key={s.team} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TeamAvatar name={s.team} size={24} />
                        <span className="truncate">{clean(s.team)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        გასცა {s.to && <><ArrowRight className="h-3 w-3" /> {clean(s.to)}</>}
                      </div>
                      {s.gives.map((p) => (
                        <div key={p.name} className="flex items-center gap-2 text-sm">
                          <PlayerPhoto pid={p.pid ?? undefined} className="h-7 w-7 rounded-full border bg-muted" />
                          {p.name}
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {past.map((p) => {
        const max = Math.max(1, ...p.teams.map((t) => t.trades));
        return (
          <section key={p.season} className="mt-10 space-y-3">
            <div>
              <h2 className="text-lg font-semibold">სეზონი {p.season}</h2>
              <p className="text-sm text-muted-foreground">
                სულ {p.total} ტრეიდი. ESPN წინა სეზონების ტრეიდების დეტალებს აღარ გასცემს — აქ ჩანს, ვინ რამდენი გააკეთა.
              </p>
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ტრეიდები გუნდების მიხედვით</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {p.teams.map((t, i) => (
                  <div key={t.team} className="grid grid-cols-[minmax(0,1fr)_1.4fr_28px] items-center gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamAvatar name={t.team} size={22} badge={false} />
                      <span className="truncate">{clean(t.team)}</span>
                      {i === 0 && t.trades > 0 && <Badge variant="gold" className="hidden sm:inline-flex">ტრეიდ-მასტერი</Badge>}
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[hsl(var(--blue))]" style={{ width: `${(t.trades / max) * 100}%` }} />
                    </div>
                    <span className="text-right tabular">{t.trades}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        );
      })}
    </>
  );
}
