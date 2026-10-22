import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import type { PlayedGame } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";
import ShareButton from "@/components/league/ShareButton";

type Award = { icon: string; label: string; team: string; value: string; sub: string; tone: "gold" | "red" | "blue" | "win" };

function awards(games: PlayedGame[], previous: PlayedGame[] = []): Award[] {
  if (!games.length) return [];
  const sides = games.flatMap((g) => [
    { team: g.h, s: g.hs, opp: g.a, os: g.as },
    { team: g.a, s: g.as, opp: g.h, os: g.hs },
  ]);
  const by = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, b) => (f(b) > f(a) ? b : a));
  const top = by(sides, (x) => x.s);
  const low = by(sides, (x) => -x.s);
  const blow = by(games, (g) => Math.abs(g.hs - g.as));
  const close = by(games, (g) => -Math.abs(g.hs - g.as));
  const losers = sides.filter((x) => x.s < x.os);
  const winners = sides.filter((x) => x.s > x.os);
  const out: Award[] = [
    { icon: "🏆", label: "კვირის MVP", team: top.team, value: fmt(top.s), sub: `vs ${clean(top.opp)}`, tone: "gold" },
    {
      icon: "💥",
      label: "ყველაზე დიდი მოგება",
      team: blow.hs > blow.as ? blow.h : blow.a,
      value: `+${fmt(Math.abs(blow.hs - blow.as))}`,
      sub: `${fmt(Math.max(blow.hs, blow.as))}–${fmt(Math.min(blow.hs, blow.as))}`,
      tone: "red",
    },
    {
      icon: "😬",
      label: "ყველაზე ახლო მატჩი",
      team: close.hs > close.as ? close.h : close.a,
      value: `${fmt(Math.abs(close.hs - close.as))} ქულა`,
      sub: `${clean(close.h)} vs ${clean(close.a)}`,
      tone: "blue",
    },
  ];
  if (losers.length) {
    const u = by(losers, (x) => x.s);
    out.push({ icon: "😭", label: "უიღბლო წაგება", team: u.team, value: fmt(u.s), sub: `მაინც წააგო ${clean(u.opp)}-თან`, tone: "blue" });
  }
  if (winners.length) {
    const l = by(winners, (x) => -x.s);
    out.push({ icon: "🍀", label: "იღბლიანი მოგება", team: l.team, value: fmt(l.s), sub: `და მაინც მოიგო`, tone: "win" });
  }
  out.push({ icon: "🧊", label: "ყინულის კვირა", team: low.team, value: fmt(low.s), sub: "კვირის ყველაზე დაბალი", tone: "blue" });
  const previousScores = new Map(previous.flatMap((g) => [[g.h, g.hs] as const, [g.a, g.as] as const]));
  const changes = sides.filter((x) => previousScores.has(x.team)).map((x) => ({ ...x, change: x.s - previousScores.get(x.team)! }));
  if (changes.length) {
    const rise = by(changes, (x) => x.change);
    const fall = by(changes, (x) => -x.change);
    out.push({ icon: "📈", label: "აღმასვლა", team: rise.team, value: `${rise.change >= 0 ? "+" : ""}${fmt(rise.change)}`, sub: "წინა კვირასთან შედარებით", tone: "win" });
    out.push({ icon: "📉", label: "დაღმასვლა", team: fall.team, value: fmt(fall.change), sub: "წინა კვირასთან შედარებით", tone: "red" });
  }
  return out;
}

function headline(games: PlayedGame[], week: number) {
  if (!games.length) return "";
  const a = awards(games);
  const mvp = a[0];
  const blow = a[1];
  return `კვირა ${week}: ${clean(mvp.team)} კვირის საუკეთესოა ${mvp.value} ქულით, ხოლო ${clean(blow.team)}-მა მოწინააღმდეგე ${blow.value}-ით გაანადგურა.`;
}

export default function Recap() {
  const data = useData();
  // მიმდინარე სეზონი (დასრულებული კვირებით) პირველი, მერე ისტორია
  const curGames = data.current.schedule.filter((g) => g.done).map((g) => ({ p: g.p, h: g.h, a: g.a, hs: g.hs, as: g.as, po: false }));
  const seasons = [
    ...(curGames.length && !data.seasons.some((s) => s.label === data.current.label) ? [{ label: data.current.label, games: curGames }] : []),
    ...data.seasons.filter((s) => s.games?.length),
  ];
  const [si, setSi] = useState(0);
  const season = seasons[si];
  const weeks = useMemo(() => [...new Set((season?.games ?? []).map((g) => g.p))].sort((a, b) => a - b), [season]);
  const [wk, setWk] = useState<number | null>(null);
  const week = wk ?? weeks[weeks.length - 1];
  const games = (season?.games ?? []).filter((g) => g.p === week);
  const previousGames = (season?.games ?? []).filter((g) => g.p === week - 1);
  const list = awards(games, previousGames);
  const wi = weeks.indexOf(week);

  if (!season) {
    return (
      <>
        <PageHeader title="კვირის რეპორტაჟი" />
        <p className="text-sm text-muted-foreground">რეპორტაჟი პირველი კვირის დასრულების შემდეგ გამოჩნდება.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="კვირის რეპორტაჟი" description="ყოველი კვირის მთავარი მომენტები: საუკეთესო, ყველაზე დიდი მოგება, უიღბლო წაგება და სხვა.">
        <ShareButton title={`${season.label} · კვირა ${week}`} text={headline(games, week)} />
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {seasons.map((s, i) => (
            <Button
              key={s.label}
              size="sm"
              variant={i === si ? "default" : "outline"}
              className={cn(i !== si && "bg-transparent")}
              onClick={() => {
                setSi(i);
                setWk(null);
              }}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="წინა კვირა" disabled={wi <= 0} onClick={() => setWk(weeks[wi - 1])}>
            <ChevronLeft />
          </Button>
          <span className="min-w-[96px] text-center font-semibold">
            კვირა {week}
            {games.some((g) => g.po) && (
              <Badge variant="gold" className="ml-1.5 px-1.5 py-0 text-[10px]">
                PO
              </Badge>
            )}
          </span>
          <Button variant="ghost" size="icon" aria-label="შემდეგი კვირა" disabled={wi >= weeks.length - 1} onClick={() => setWk(weeks[wi + 1])}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <Card key={`${si}-${week}`} className="tone-card mb-6" style={tone("gold")}>
        <CardContent className="p-5 sm:p-6">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-amber-200/70">📰 სათაური</div>
          <p className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{headline(games, week)}</p>
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        {list.map((a) => (
          <Card key={a.label + week} className="tone-card lift" style={tone(a.tone)}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-lg">{a.icon}</span> {a.label}
              </div>
              <div className="flex items-center gap-2">
                <TeamAvatar name={a.team} size={26} badge={false} />
                <span className="truncate font-semibold">{clean(a.team)}</span>
              </div>
              <div className="text-2xl font-bold tabular">{a.value}</div>
              <div className="truncate text-xs text-muted-foreground">{a.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">შედეგები</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {games.map((g, i) => {
          const hw = g.hs > g.as;
          return (
            <Card key={i} className="p-4">
              {[
                [g.h, g.hs, hw],
                [g.a, g.as, !hw && g.hs !== g.as],
              ].map(([n, s, w]) => (
                <div key={n as string} className={cn("flex items-center gap-3 py-1", !w && "opacity-60")}>
                  <TeamAvatar name={n as string} size={28} badge={false} />
                  <span className={cn("flex-1 truncate", w && "font-semibold")}>{clean(n as string)}</span>
                  <span className={cn("text-lg tabular", w ? "font-bold" : "")}>{fmt(s as number)}</span>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </>
  );
}
