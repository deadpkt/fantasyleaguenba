import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { useData } from "@/lib/league";
import { clean } from "@/lib/format";
import { tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import Updated from "@/components/league/Updated";
import TradeBlock from "@/components/league/TradeBlock";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
/** "22 Oct, 13:35" თბილისის დროით */
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tbilisi" });

export default function Trades() {
  const data = useData();
  const { trades, current } = data;
  // მოთამაშის ამჟამინდელი ფორმა (ვისაც ახლა ჰყავს)
  const byPid = new Map(data.managers.flatMap((m) => m.roster.map((p) => [p.pid, p] as const)));
  const value = (pid: number | null) => {
    const p = pid != null ? byPid.get(pid) : undefined;
    return p ? p.per_game * Math.max(p.ros_games, 1) : 0;
  };
  const cur = trades?.current ?? [];
  const past = trades?.past ?? [];

  return (
    <>
      <PageHeader title="ტრეიდები" description="ვინ ვის რა მისცა. მიმდინარე სეზონის ტრეიდები ESPN-იდან ავტომატურად ემატება. ESPN ტრეიდს 24 საათი განიხილავს და მერე გადაჰყავს მოთამაშეები.">
        <Updated at={data.updated_at} />
      </PageHeader>

      <TradeBlock />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">ტრეიდები · {current.label}</h2>
        {cur.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
              <ArrowLeftRight className="h-4 w-4" /> ამ სეზონში ჯერ ტრეიდი არ ყოფილა. პირველი ტრეიდი აქ ავტომატურად გამოჩნდება.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cur.map((t, i) => {
              // ვინ იგებს: რასაც გუნდი იღებს (მეორე მხარის "gives") დარჩენილი სეზონის მოსალოდნელი ქულით
              const got = t.sides.map((s) => ({
                team: s.team,
                v: t.sides
                  .filter((o) => o.team !== s.team)
                  .flatMap((o) => o.gives)
                  .reduce((n, g) => n + value(g.pid), 0),
              }));
              const total = got.reduce((n, g) => n + g.v, 0);
              const best = [...got].sort((a, b) => b.v - a.v)[0];
              const close = !total || !best || best.v / total < 0.55;
              return (
                <Card key={i} className="tone-card" style={tone("blue")}>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-[hsl(var(--blue))]" /> {day(t.date)}
                      </span>
                      {t.pending ? (
                        <Badge variant="secondary" className="font-normal">
                          განხილვაში{t.process_at ? `, გადავლენ ~${when(t.process_at)}` : ""}
                        </Badge>
                      ) : total > 0 && (
                        <Badge variant={close ? "secondary" : "win"} className="font-normal">
                          {close ? "თანაბარი ტრეიდი" : `ახლა იგებს: ${clean(best.team)}`}
                        </Badge>
                      )}
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
                          გასცა{" "}
                          {s.to && (
                            <>
                              <ArrowRight className="h-3 w-3" /> {clean(s.to)}
                            </>
                          )}
                        </div>
                        {s.gives.map((p) => {
                          const now = p.pid != null ? byPid.get(p.pid) : undefined;
                          return (
                            <div key={p.name} className="flex items-center gap-2 text-sm">
                              <PlayerPhoto pid={p.pid ?? undefined} className="h-8 w-8 rounded-full border bg-muted object-cover" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate">{p.name}</div>
                                {now && (
                                  <div className="text-[11px] text-muted-foreground tabular">
                                    {now.gp ? `${now.avg} თამაშზე · ${now.gp} თამ.` : `პროგნოზი ${now.per_game} თამაშზე`}
                                    {now.injury ? ` · ${now.injury.replace(/_/g, " ")}` : ""}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
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
                სულ {p.total} ტრეიდი. ESPN წინა სეზონების ტრეიდების დეტალებს აღარ აჩვენებს, ამიტომ აქ მხოლოდ რაოდენობა ჩანს.
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
                      {i === 0 && t.trades > 0 && (
                        <Badge variant="gold" className="hidden sm:inline-flex">
                          ტრეიდ-მასტერი
                        </Badge>
                      )}
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
