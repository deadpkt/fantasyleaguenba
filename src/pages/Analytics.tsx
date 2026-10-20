import { useMemo, useState } from "react";
import { ArrowLeftRight, Search, Sparkles, UserPlus } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { key, winProb } from "@/lib/season";
import { useApi } from "@/lib/useApi";
import type { LiveData, Manager, RosterPlayer } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

const availability = (injury: string | null) => injury?.includes("OUT") || injury?.includes("IR") ? 0.8 : injury ? 0.96 : 1;
const rosterPower = (m: Manager, weeks: number) => m.roster.reduce((n, p) => n + p.projected * availability(p.injury), 0) / weeks;
const percent = (n: number) => `${Math.round(n * 100)}%`;
const preseasonChance = (home: number, away: number) => {
  const avg = Math.max(1, (home + away) / 2);
  return Math.max(0.25, Math.min(0.75, 0.5 + ((home - away) / avg) * 0.9));
};

function MatchupPreview() {
  const data = useData();
  const live = useApi<LiveData>("/api/live", 60_000);
  const weeks = data.settings?.regular_season_weeks || 19;
  const managers = useMemo(() => new Map(data.managers.map((m) => [key(m.team), m])), [data.managers]);
  const games = data.current.schedule.filter((g) => g.p === data.current.week);
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-5 w-5 text-gold" /> Matchup Preview · კვირა {data.current.week}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {games.map((g) => {
          const home = managers.get(key(g.h));
          const away = managers.get(key(g.a));
          const hp = home ? rosterPower(home, weeks) : 0;
          const ap = away ? rosterPower(away, weeks) : 0;
          const liveMatchup = live.state.status === "ready"
            ? live.state.data.matchups.find((m) =>
                (key(m.home.name) === key(g.h) && key(m.away.name) === key(g.a)) ||
                (key(m.home.name) === key(g.a) && key(m.away.name) === key(g.h)))
            : undefined;
          const liveHome = liveMatchup && key(liveMatchup.home.name) === key(g.h) ? liveMatchup.home : liveMatchup?.away;
          const liveAway = liveMatchup && key(liveMatchup.away.name) === key(g.a) ? liveMatchup.away : liveMatchup?.home;
          const hasWeeklyProjection = liveHome?.projected != null && liveAway?.projected != null;
          const chance = hasWeeklyProjection
            ? winProb(liveHome!, liveAway!)
            : preseasonChance(hp, ap);
          return (
            <Card key={`${g.p}-${g.h}-${g.a}`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="min-w-0"><TeamAvatar name={g.h} size={38} /><div className="mt-2 truncate text-sm font-medium">{clean(g.h)}</div><div className="text-xl font-bold tabular">{percent(chance)}</div></div>
                  <div className="text-xs text-muted-foreground">VS</div>
                  <div className="min-w-0 text-right"><div className="flex justify-end"><TeamAvatar name={g.a} size={38} /></div><div className="mt-2 truncate text-sm font-medium">{clean(g.a)}</div><div className="text-xl font-bold tabular">{percent(1 - chance)}</div></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{hasWeeklyProjection ? `ESPN ${fmt(liveHome!.projected!)}` : `საწყისი შეფასება ${fmt(hp)}`}</span>
                  <span className="text-right">{hasWeeklyProjection ? `ESPN ${fmt(liveAway!.projected!)}` : `საწყისი შეფასება ${fmt(ap)}`}</span>
                </div>
                {!hasWeeklyProjection && <p className="mt-2 text-center text-[11px] text-muted-foreground">ESPN-ის კვირის projection ჯერ არ გამოქვეყნებულა — პროცენტი მხოლოდ როსტერების რბილი შედარებაა.</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function WaiverWatch() {
  const { waivers = [] } = useData();
  const [query, setQuery] = useState("");
  const shown = waivers.filter((p) => `${p.name} ${p.pos} ${p.pro}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><UserPlus className="h-5 w-5 text-win" /> Waiver Watch</h2><label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"><Search className="h-4 w-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="მოთამაშის ძებნა" className="w-40 bg-transparent text-sm outline-none" /></label></div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => <Card key={p.pid}><CardContent className="flex items-center gap-3 p-3"><span className="w-5 text-xs text-muted-foreground">{i + 1}</span><PlayerPhoto pid={p.pid} className="h-9 w-9 rounded-full border bg-muted" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.pos} · {p.pro}{p.injury ? ` · ${p.injury.replace(/_/g, " ")}` : ""}</div></div><div className="text-right"><div className="font-semibold tabular">{fmt(p.avg || p.projected_avg)}</div><div className="text-[10px] text-muted-foreground">{p.avg ? "AVG" : "PROJ"}</div></div></CardContent></Card>)}
      </div>
    </section>
  );
}

const selectClass = "w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm";

function TradeAnalyzer() {
  const { managers } = useData();
  const [a, setA] = useState(0), [b, setB] = useState(1), [pa, setPa] = useState(0), [pb, setPb] = useState(0);
  const A = managers[a], B = managers[b];
  const one = A?.roster[pa], two = B?.roster[pb];
  const seasonDelta = one && two ? two.projected - one.projected : 0;
  const playerAvg = (player: RosterPlayer) => player.projected_avg || player.projected / 72;
  const perGameDelta = one && two ? playerAvg(two) - playerAvg(one) : 0;
  const clearWinner = Math.sign(seasonDelta) === Math.sign(perGameDelta) && Math.abs(perGameDelta) >= 2;
  return (
    <section className="space-y-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><ArrowLeftRight className="h-5 w-5 text-[hsl(var(--blue))]" /> Trade Analyzer</h2>
      <Card><CardHeader><CardTitle className="text-base">ერთი-ერთზე გაცვლა</CardTitle><CardDescription>შეფასება მიმდინარე სეზონის ESPN projection-ითაა.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        <TradeSide managers={managers} team={a} player={pa} onTeam={(v) => { setA(v); setPa(0); }} onPlayer={setPa} selected={one} />
        <div className="grid place-items-center"><ArrowLeftRight className="h-5 w-5 text-muted-foreground" /></div>
        <TradeSide managers={managers} team={b} player={pb} onTeam={(v) => { setB(v); setPb(0); }} onPlayer={setPb} selected={two} />
        <div className="md:col-span-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center text-sm">
          {!one || !two
            ? "აირჩიე მოთამაშეები"
            : !clearWinner
              ? `ახლო ტრეიდია · სხვაობა ${perGameDelta >= 0 ? "+" : ""}${perGameDelta.toFixed(1)} ქულა/თამაში და ${seasonDelta >= 0 ? "+" : ""}${fmt(seasonDelta)} სეზონზე`
              : perGameDelta > 0
                ? `${clean(A.team)} იღებს უკეთეს projection-ს: +${perGameDelta.toFixed(1)} ქულა/თამაში · +${fmt(seasonDelta)} სეზონზე`
                : `${clean(B.team)} იღებს უკეთეს projection-ს: +${(-perGameDelta).toFixed(1)} ქულა/თამაში · +${fmt(-seasonDelta)} სეზონზე`}
        </div>
      </CardContent></Card>
    </section>
  );
}

function TradeSide({ managers, team, player, onTeam, onPlayer, selected }: { managers: Manager[]; team: number; player: number; onTeam: (v: number) => void; onPlayer: (v: number) => void; selected?: RosterPlayer }) {
  const m = managers[team];
  return <div className="space-y-2"><select className={selectClass} value={team} onChange={(e) => onTeam(Number(e.target.value))}>{managers.map((x, i) => <option key={x.tid} value={i}>{clean(x.team)}</option>)}</select><select className={selectClass} value={player} onChange={(e) => onPlayer(Number(e.target.value))}>{m?.roster.map((p, i) => <option key={p.pid} value={i}>{p.name}</option>)}</select>{selected && <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2"><PlayerPhoto pid={selected.pid} className="h-8 w-8 rounded-full" /><span className="text-sm">{(selected.projected_avg || selected.projected / 72).toFixed(1)}/თამაში · {fmt(selected.projected)} სეზონი</span></div>}</div>;
}

export default function Analytics() { return <><PageHeader title="ანალიტიკა" description="კვირის matchup-ები, საუკეთესო თავისუფალი აგენტები და ტრეიდების შეფასება — მიმდინარე ESPN მონაცემებით." /><div className="space-y-10"><MatchupPreview /><WaiverWatch /><TradeAnalyzer /></div></>; }
