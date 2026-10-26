import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Handshake, Snowflake, Sparkles, Swords, TrendingDown, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import { clean, fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlayedGame } from "@/types";
import { TeamAvatar } from "@/components/league/team";
import ShareButton from "@/components/league/ShareButton";

type Award = { icon: LucideIcon; label: string; team: string; value: string; sub: string; color: string };

/** კვირის ჯილდოები შედეგებიდან */
export function awards(games: PlayedGame[], previous: PlayedGame[] = []): Award[] {
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
    { icon: Trophy, label: "კვირის MVP", team: top.team, value: fmt(top.s), sub: `vs ${clean(top.opp)}`, color: "--gold" },
    {
      icon: Flame,
      label: "ყველაზე დიდი მოგება",
      team: blow.hs > blow.as ? blow.h : blow.a,
      value: `+${fmt(Math.abs(blow.hs - blow.as))}`,
      sub: `${fmt(Math.max(blow.hs, blow.as))} : ${fmt(Math.min(blow.hs, blow.as))}`,
      color: "--red",
    },
    {
      icon: Swords,
      label: "ყველაზე ახლო მატჩი",
      team: close.hs > close.as ? close.h : close.a,
      value: `${fmt(Math.abs(close.hs - close.as))} ქულა`,
      sub: `${clean(close.h)} vs ${clean(close.a)}`,
      color: "--blue",
    },
  ];
  if (losers.length) {
    const u = by(losers, (x) => x.s);
    out.push({ icon: Handshake, label: "უიღბლო წაგება", team: u.team, value: fmt(u.s), sub: `და მაინც წააგო ${clean(u.opp)}-თან`, color: "--muted-foreground" });
  }
  if (winners.length) {
    const l = by(winners, (x) => -x.s);
    out.push({ icon: Sparkles, label: "იღბლიანი მოგება", team: l.team, value: fmt(l.s), sub: "და მაინც მოიგო", color: "--win" });
  }
  out.push({ icon: Snowflake, label: "ყინულის კვირა", team: low.team, value: fmt(low.s), sub: "კვირის ყველაზე დაბალი", color: "--blue" });
  const previousScores = new Map(previous.flatMap((g) => [[g.h, g.hs] as const, [g.a, g.as] as const]));
  const changes = sides.filter((x) => previousScores.has(x.team)).map((x) => ({ ...x, change: x.s - previousScores.get(x.team)! }));
  if (changes.length) {
    const rise = by(changes, (x) => x.change);
    const fall = by(changes, (x) => -x.change);
    out.push({ icon: TrendingUp, label: "აღმასვლა", team: rise.team, value: `${rise.change >= 0 ? "+" : ""}${fmt(rise.change)}`, sub: "წინა კვირასთან", color: "--win" });
    out.push({ icon: TrendingDown, label: "დაღმასვლა", team: fall.team, value: fmt(fall.change), sub: "წინა კვირასთან", color: "--red" });
  }
  return out;
}

export function headline(games: PlayedGame[], week: number, live = false) {
  if (!games.length) return "";
  const a = awards(games);
  if (live) return `კვირა ${week} ჯერ მიმდინარეობს: ${clean(a[0].team)} ლიდერობს ${a[0].value} ქულით, ${clean(a[1].team)} კი მოწინააღმდეგეს ${a[1].value}-ით უსწრებს.`;
  return `კვირა ${week}: ${clean(a[0].team)} კვირის საუკეთესოა ${a[0].value} ქულით, ხოლო ${clean(a[1].team)}-მა მოწინააღმდეგე ${a[1].value}-ით დაამარცხა.`;
}

/** კვირის ტაბლო: ყველა გუნდი ამ კვირის ქულით, ზოლებით */
function WeekBoard({ games }: { games: PlayedGame[] }) {
  const rows = games
    .flatMap((g) => [
      { team: g.h, s: g.hs, won: g.hs > g.as },
      { team: g.a, s: g.as, won: g.as > g.hs },
    ])
    .sort((a, b) => b.s - a.s);
  const max = Math.max(1, ...rows.map((r) => r.s));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.team} className="flex items-center gap-3">
          <span className="w-4 text-right text-xs text-muted-foreground tabular">{i + 1}</span>
          <TeamAvatar name={r.team} size={26} badge={false} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={cn("truncate", r.won ? "font-medium" : "text-muted-foreground")}>{clean(r.team)}</span>
              <span className="shrink-0 font-semibold tabular">{fmt(r.s)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className={cn("bar-fill h-full rounded-full", r.won ? "bg-win/70" : "bg-white/25")} style={{ width: `${(r.s / max) * 100}%`, animationDelay: `${i * 40}ms` }} />
            </div>
          </div>
          <span className={cn("w-5 text-center text-[11px] font-semibold", r.won ? "text-win" : "text-loss")}>{r.won ? "W" : "L"}</span>
        </div>
      ))}
    </div>
  );
}

/** ერთი სეზონის რეპორტაჟი: კვირის არჩევა, სათაური, ჯილდოები, ტაბლო და შედეგები */
export function RecapBoard({ label, games: all, liveWeek }: { label: string; games: PlayedGame[]; liveWeek?: number }) {
  const weeks = useMemo(() => [...new Set(all.map((g) => g.p))].sort((a, b) => a - b), [all]);
  const [wk, setWk] = useState<number | null>(null);
  const week = wk ?? weeks[weeks.length - 1];
  const games = all.filter((g) => g.p === week);
  const list = awards(games, all.filter((g) => g.p === week - 1));
  const wi = weeks.indexOf(week);
  const playoff = games.some((g) => g.po);
  const live = week === liveWeek;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-card p-1">
          <button type="button" aria-label="წინა კვირა" disabled={wi <= 0} onClick={() => setWk(weeks[wi - 1])} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[92px] text-center text-sm font-semibold">
            კვირა {week}
            {playoff && <span className="ml-1.5 rounded bg-[hsl(var(--gold))]/15 px-1 text-[10px] text-gold">PO</span>}
          </span>
          <button type="button" aria-label="შემდეგი კვირა" disabled={wi >= weeks.length - 1} onClick={() => setWk(weeks[wi + 1])} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <ShareButton title={`${label} · კვირა ${week}`} text={headline(games, week, live)} />
      </div>

      {/* სათაური */}
      <div key={`h${week}`} className="pass-in rounded-2xl border border-white/[0.08] bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          {label} · კვირა {week}
          {live && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--red))]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--red))]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--red))]" /> LIVE · წინასწარი
            </span>
          )}
        </div>
        <p className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{headline(games, week, live)}</p>
      </div>

      {/* ჯილდოები */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {list.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.label + week} className="pass-in space-y-2.5 rounded-2xl border border-white/[0.08] bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: `hsl(var(${a.color}) / 0.14)`, color: `hsl(var(${a.color}))` }}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {a.label}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <TeamAvatar name={a.team} size={24} badge={false} />
                <span className="truncate text-sm font-semibold">{clean(a.team)}</span>
              </div>
              <div className="text-2xl font-semibold tabular">{a.value}</div>
              <div className="truncate text-xs text-muted-foreground">{a.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {/* კვირის ტაბლო */}
        <section className="space-y-3 rounded-2xl border border-white/[0.08] bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold">კვირის ტაბლო</h2>
          <WeekBoard games={games} />
        </section>

        {/* შედეგები */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">შედეგები</h2>
          <div className="space-y-2">
            {games.map((g, i) => {
              const hw = g.hs > g.as;
              return (
                <div key={i} className="space-y-1.5 rounded-2xl border border-white/[0.08] bg-card p-3.5">
                  {(
                    [
                      [g.h, g.hs, hw],
                      [g.a, g.as, !hw && g.hs !== g.as],
                    ] as const
                  ).map(([n, s, w]) => (
                    <div key={n} className="flex items-center gap-3">
                      <span className="h-6 w-1 rounded-full" style={{ background: w ? "hsl(var(--win))" : "rgb(255 255 255 / 0.12)" }} />
                      <TeamAvatar name={n} size={26} badge={false} />
                      <span className={cn("flex-1 truncate text-sm", w ? "font-semibold" : "text-muted-foreground")}>{clean(n)}</span>
                      <span className={cn("text-lg tabular", w ? "font-semibold" : "text-muted-foreground")}>{fmt(s)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
