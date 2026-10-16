import { Link } from "react-router-dom";
import { ArrowRight, Crown, Dices, Flame, TrendingUp } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt, plain, signedPct } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Countdown from "@/components/league/Countdown";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

function Trophy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="trophy-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset=".5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <path
        fill="url(#trophy-g)"
        d="M62 30h76v14h26c0 34-14 52-36 56-6 14-16 22-28 25v20h22v14H78v-14h22v-20c-12-3-22-11-28-25-22-4-36-22-36-56h26zm-12 28c2 16 8 26 16 30-3-9-4-19-4-30zm100 0h-12c0 11-1 21-4 30 8-4 14-14 16-30z"
      />
      <circle cx="100" cy="66" r="17" fill="#ea580c" />
      <path d="M83 66h34M100 49v34" stroke="#431407" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/** მინი სვეტოვანი გრაფიკი — გუნდის ყოველი კვირა, რეკორდული გამოკვეთილია */
function Bars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const hi = values.indexOf(max);
  return (
    <div className="flex h-14 items-end gap-[3px]" aria-hidden="true">
      {values.map((v, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-t-sm",
            i === hi ? "bg-[hsl(var(--blue))] shadow-[0_0_12px_hsl(var(--blue)/0.6)]" : "bg-[hsl(var(--blue)/0.25)]",
          )}
          style={{ height: `${15 + ((v - min) / Math.max(1, max - min)) * 85}%` }}
        />
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-xl font-semibold tabular">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function Home() {
  const data = useData();
  const { current } = data;
  const champ = data.champions[data.champions.length - 1];
  const last = data.seasons.find((s) => s.complete);
  const champRow = last?.standings.find((t) => t.final === 1);
  const streak = data.records.find((r) => r.k.includes("მოგებების"));
  const high = data.records.find((r) => r.k.includes("მაღალი"));
  const mvp = last?.awards.mvp;
  const steal = last?.draft?.steals[0];
  const lucky = last?.luck[0];
  const recTeam = high && last?.weekly.teams.find((t) => plain(t.name) === plain(high.who));
  const recScores = recTeam ? recTeam.scores.map((x) => (x ? x[0] : 0)) : [];

  return (
    <div className="space-y-12 pb-4">
      {/* ჰერო */}
      <section className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-[1.2fr_1fr] md:items-end md:pt-16">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-[hsl(var(--red))] to-[hsl(var(--blue))]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Fantasy NBA · {current.label}</span>
          </div>
          <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text pb-1 text-5xl font-bold tracking-tight text-transparent sm:text-6xl md:text-7xl">
            {clean(data.league)}
          </h1>
          <p className="max-w-md text-muted-foreground">
            {current.standings.length} გუნდი, ერთი ბანერი. ცხრილი, ისტორია და რეკორდები — პირდაპირ ESPN-იდან.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/standings">
                ცხრილი <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent">
              <Link to="/managers">მენეჯერები</Link>
            </Button>
          </div>
        </div>
        <Countdown draft={current.draft} drafted={current.drafted} />
      </section>

      {/* Storylines */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Storylines</h2>
          <p className="text-sm text-muted-foreground">მთავარი ამბები ახალ სეზონამდე</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {champ && (
            <Card className="tone-card lift md:col-span-4 md:row-span-2" style={tone("gold")}>
              <Trophy className="pointer-events-none absolute -right-6 -top-2 h-28 w-28 opacity-25 drop-shadow-[0_20px_30px_rgba(245,158,11,0.25)] sm:-right-4 sm:top-4 sm:h-52 sm:w-52 sm:opacity-90" />
              <CardHeader>
                <CardDescription className="flex items-center gap-2 text-gold">
                  <Crown className="h-4 w-4" /> მოქმედი ჩემპიონი · {champ.season}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="flex items-center gap-4">
                  <TeamAvatar name={champ.team} size={76} className="[&>img:first-child]:rounded-xl [&>span:first-child]:rounded-xl" />
                  <div className="min-w-0 sm:pr-44">
                    <div className="break-words text-3xl font-bold tracking-tight sm:truncate sm:text-5xl">{clean(champ.team)}</div>
                    {champ.runner && <div className="mt-1 text-sm text-muted-foreground">ფინალში დაამარცხა {clean(champ.runner)}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Stat label="რეკორდი" value={champ.rec} />
                  {champRow && <Stat label="ქულა სეზონში" value={fmt(champRow.pf)} />}
                  {streak && plain(streak.who) === plain(champ.team) && <Stat label="მოგება ზედიზედ" value={streak.v} />}
                </div>
                <p className="border-l-2 border-gold/60 pl-3 text-sm text-amber-100/80">ტახტი დაკავებულია. 2026-27-ში ყველა მასზე ნადირობს.</p>
              </CardContent>
            </Card>
          )}

          {mvp && (
            <Card className="tone-card lift flex flex-col md:col-span-2 md:row-span-2" style={tone("red")}>
              <div className="relative h-48 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_100%,hsl(var(--red)/0.35),transparent_70%)]" />
                <PlayerPhoto pid={mvp.pid} className="relative mx-auto h-full w-auto object-contain" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription>სეზონის MVP · {last?.label}</CardDescription>
                <CardTitle className="text-2xl">{mvp.player}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="text-4xl font-bold tabular text-[hsl(var(--red))]">
                  {fmt(mvp.total)} <span className="text-sm font-normal text-muted-foreground">FP</span>
                </div>
                <div className="text-sm text-muted-foreground">{mvp.avg} ქულა თამაშში</div>
              </CardContent>
            </Card>
          )}

          {high && (
            <Card className="tone-card lift md:col-span-2" style={tone("blue")}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[hsl(var(--blue))]" /> რეკორდული კვირა
                </CardDescription>
                <CardTitle className="text-4xl tabular text-[hsl(var(--blue))]">{high.v}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <TeamAvatar name={high.who} size={22} badge={false} />
                  <span className="font-medium">{clean(high.who)}</span>
                  <span className="truncate text-muted-foreground">· {high.when}</span>
                </div>
                {recScores.length > 0 && <Bars values={recScores} />}
              </CardContent>
            </Card>
          )}

          {steal && (
            <Card className="tone-card lift md:col-span-2" style={tone("win")}>
              <PlayerPhoto
                pid={steal.pid}
                className="pointer-events-none absolute -right-3 top-0 h-28 w-36 opacity-80 [mask-image:linear-gradient(200deg,#000_40%,transparent_85%)]"
              />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-win" /> დრაფტის Steal
                </CardDescription>
                <CardTitle className="pr-20 text-xl">{steal.player}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 text-3xl font-bold tabular">
                  <span className="text-muted-foreground line-through decoration-2">#{steal.n}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-muted-foreground/50 to-[hsl(var(--win))]" />
                  <span className="text-win">#{steal.rank}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  +{steal.n - steal.rank} ადგილი · {clean(steal.team)}
                </div>
              </CardContent>
            </Card>
          )}

          {lucky && (
            <Card className="tone-card lift md:col-span-2" style={tone("gold")}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Dices className="h-4 w-4 text-gold" /> ყველაზე იღბლიანი
                </CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TeamAvatar name={lucky.name} size={24} badge={false} />
                  <span className="truncate">{clean(lucky.name)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold tabular text-gold">{signedPct(lucky.luck)}</div>
                {(
                  [
                    ["რეალური", lucky.real, "bg-gold"],
                    ["All-play", lucky.allplay, "bg-muted-foreground/50"],
                  ] as const
                ).map(([l, v, c]) => (
                  <div key={l} className="grid grid-cols-[64px_1fr_36px] items-center gap-2 text-xs text-muted-foreground">
                    <span>{l}</span>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${c}`} style={{ width: `${v * 100}%` }} />
                    </div>
                    <span className="text-right tabular text-foreground">{Math.round(v * 100)}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* სწრაფი ლინკები */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["/history", "ისტორია", "ჩემპიონები, All-Time"],
          ["/records", "რეკორდები", "ლიგის რეკორდები"],
          ["/seasons", "სეზონები", "კვირები, დრაფტი"],
          ["/h2h", "Head to Head", "ვინ ვის ფლობს"],
        ].map(([to, t, d]) => (
          <Link
            key={to}
            to={to}
            className="group rounded-xl border bg-card/60 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-card"
          >
            <div className="flex items-center justify-between font-medium">
              {t}
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{d}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
