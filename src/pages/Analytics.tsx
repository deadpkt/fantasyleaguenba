import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeftRight, CalendarDays, Plus, Search, Sparkles, UserPlus, X } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { key, projectedWin } from "@/lib/season";
import { cn } from "@/lib/utils";
import type { Manager, RosterPlayer } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import Updated from "@/components/league/Updated";
import SeasonOdds from "@/pages/Odds";

const percent = (n: number) => `${Math.round(n * 100)}%`;
const injuryLabel = (s: string | null) => (s ? s.replace(/_/g, " ") : "");
/** შანსი, რომ ითამაშებს დარჩენილ სეზონში */
const ros = (s: string | null) => {
  const x = (s || "").toUpperCase();
  if (x.includes("INJURY_RESERVE")) return 0.75;
  if (x.includes("OUT")) return 0.9;
  if (x.includes("SUSP")) return 0.95;
  return 1;
};
const rosValue = (p: RosterPlayer) => p.per_game * p.ros_games * ros(p.injury);

function Section({ icon, title, sub, children, right }: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            {icon} {title}
          </h2>
          {sub && <p className="max-w-3xl text-sm text-muted-foreground">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ───────── ამ კვირის მატჩები ───────── */

function MatchupPreview() {
  const data = useData();
  const pj = data.projections;
  const managers = useMemo(() => new Map(data.managers.map((m) => [key(m.team), m])), [data.managers]);
  const week = pj?.week ?? data.current.week;
  const games = data.current.schedule.filter((g) => g.p === week);
  const team = (n: string) => Object.entries(pj?.teams ?? {}).find(([k]) => key(k) === key(n))?.[1];

  return (
    <Section
      icon={<Sparkles className="h-5 w-5 text-gold" />}
      title={`კვირა ${week}: მატჩების პროგნოზი`}
      sub="ქულა ახლა, პროგნოზი კვირის ბოლოსთვის და ვინ ითამაშებს კიდევ. ითვლება მოთამაშეებით: საშუალო, ტრავმები, დარჩენილი თამაშები, 10 აქტიური სლოტი."
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {games.map((g) => {
          const p = projectedWin(data, g.h, g.a) ?? 0.5;
          const sides = [
            { n: g.h, t: team(g.h), m: managers.get(key(g.h)), pr: p },
            { n: g.a, t: team(g.a), m: managers.get(key(g.a)), pr: 1 - p },
          ];
          return (
            <Card key={`${g.h}-${g.a}`}>
              <CardContent className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  {sides.map(({ n, t, pr }, i) => (
                    <div key={n} className={cn("min-w-0", i === 1 && "text-right")}>
                      <div className={cn("flex items-center gap-2", i === 1 && "flex-row-reverse")}>
                        <TeamAvatar name={n} size={36} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{clean(n)}</div>
                          <div className="text-[11px] text-muted-foreground">{t ? `${t.games_left} თამაში დარჩა` : ""}</div>
                        </div>
                      </div>
                      <div className={cn("mt-2 text-2xl font-bold tabular", pr >= 0.5 ? "text-foreground" : "text-muted-foreground")}>{percent(pr)}</div>
                      {t && (
                        <div className="text-xs text-muted-foreground tabular">
                          ახლა {fmt(Math.round(t.so_far))} · პროგნოზი <b className="text-foreground">{fmt(Math.round(t.final))}</b>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="bg-[hsl(var(--red))] transition-all duration-700" style={{ width: `${p * 100}%` }} />
                  <div className="w-0.5 bg-black" />
                  <div className="flex-1 bg-[hsl(var(--blue))]" />
                </div>
                {/* ვინ მოიტანს დარჩენილ ქულებს */}
                <div className="grid grid-cols-2 gap-3">
                  {sides.map(({ n, m }, i) => {
                    const top = [...(m?.roster ?? [])]
                      .filter((x) => x.week_left > 0)
                      .sort((a, b) => b.week_expected - a.week_expected)
                      .slice(0, 3);
                    return (
                      <div key={n} className="space-y-1">
                        <div className={cn("text-[10px] uppercase tracking-wider text-muted-foreground", i === 1 && "text-right")}>მთავარი დარჩენილი</div>
                        {top.length === 0 && <div className={cn("text-xs text-muted-foreground", i === 1 && "text-right")}>თამაშები დასრულდა</div>}
                        {top.map((x) => (
                          <div key={x.pid} className={cn("flex items-center gap-1.5 text-xs", i === 1 && "flex-row-reverse text-right")}>
                            <PlayerPhoto pid={x.pid} className="h-6 w-6 shrink-0 rounded-full bg-muted object-cover" />
                            <span className="min-w-0 flex-1 truncate">{x.name}</span>
                            <span className="shrink-0 text-muted-foreground tabular" title={`${x.week_left} თამაში × ${x.per_game} ქულა`}>
                              {x.week_left}×{Math.round(x.per_game)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

/* ───────── დარჩენილი თამაშები ───────── */

function GamesLeft() {
  const data = useData();
  const rows = Object.entries(data.projections?.teams ?? {})
    .map(([n, t]) => ({ n, ...t }))
    .sort((a, b) => b.games_left - a.games_left);
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.map((r) => r.games_left));
  return (
    <Section
      icon={<CalendarDays className="h-5 w-5 text-[hsl(var(--blue))]" />}
      title="ვის რამდენი თამაში დარჩა ამ კვირაში"
      sub="ითვლება მხოლოდ ის თამაშები, რომლებიც 10 აქტიურ სლოტში მოხვდება. მარჯვნივ: მოსალოდნელი ქულა კვირის ბოლომდე."
    >
      <Card>
        <CardContent className="space-y-2 p-4">
          {rows.map((r) => (
            <div key={r.n} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <TeamAvatar name={r.n} size={22} badge={false} />
                <span className="truncate">{clean(r.n)}</span>
              </span>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="bar-fill h-full origin-left rounded-full bg-[hsl(var(--blue))]" style={{ width: `${(r.games_left / max) * 100}%` }} />
              </div>
              <span className="w-28 text-right text-xs text-muted-foreground tabular">
                <b className="text-foreground">{r.games_left}</b> თამაში · +{fmt(Math.round(r.remaining))}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </Section>
  );
}

/* ───────── თავისუფალი აგენტები ───────── */

function WaiverWatch() {
  const { waivers = [] } = useData();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"week" | "season">("week");
  const shown = waivers
    .filter((p) => `${p.name} ${p.pos} ${p.pro}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (mode === "week" ? b.week_expected - a.week_expected : b.per_game - a.per_game))
    .slice(0, 12);
  return (
    <Section
      icon={<UserPlus className="h-5 w-5 text-win" />}
      title="თავისუფალი აგენტები"
      sub={mode === "week" ? "ვინ მოიტანს ყველაზე მეტს ამ კვირის დარჩენილ თამაშებში." : "ვისაც ყველაზე მაღალი ქულა აქვს თამაშზე."}
      right={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {(
              [
                ["week", "ამ კვირისთვის"],
                ["season", "სეზონისთვის"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={cn("rounded-md px-3 py-1.5 text-xs transition-colors", mode === v ? "bg-white text-black" : "text-muted-foreground hover:text-foreground")}
              >
                {l}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ძებნა" className="w-32 bg-transparent text-sm outline-none" />
          </label>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => (
          <Card key={p.pid}>
            <CardContent className="flex items-center gap-3 p-3">
              <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
              <PlayerPhoto pid={p.pid} className="h-10 w-10 rounded-full border bg-muted object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {p.pos} · {p.pro}
                  {p.injury && (
                    <Badge variant="loss" className="px-1 py-0 text-[9px]">
                      {injuryLabel(p.injury)}
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {p.week_left} თამაში ამ კვირაში · {p.gp} ნათამაშები
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold tabular">{mode === "week" ? fmt(p.week_expected) : p.per_game.toFixed(1)}</div>
                <div className="text-[10px] text-muted-foreground">{mode === "week" ? "კვირაში" : "თამაშზე"}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

/* ───────── ტრეიდის ანალიზი ───────── */

const selectClass = "w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm";

function TradeSide({
  managers,
  team,
  picked,
  onTeam,
  onToggle,
}: {
  managers: Manager[];
  team: number;
  picked: number[];
  onTeam: (v: number) => void;
  onToggle: (pid: number) => void;
}) {
  const m = managers[team];
  const [adding, setAdding] = useState("");
  const chosen = (m?.roster ?? []).filter((p) => picked.includes(p.pid));
  return (
    <div className="space-y-2">
      <select className={selectClass} value={team} onChange={(e) => onTeam(Number(e.target.value))}>
        {managers.map((x, i) => (
          <option key={x.tid} value={i}>
            {clean(x.team)}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select className={selectClass} value={adding} onChange={(e) => setAdding(e.target.value)}>
          <option value="">აირჩიე მოთამაშე…</option>
          {m?.roster
            .filter((p) => !picked.includes(p.pid))
            .map((p) => (
              <option key={p.pid} value={p.pid}>
                {p.name} ({p.per_game.toFixed(1)})
              </option>
            ))}
        </select>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="shrink-0 bg-transparent"
          disabled={!adding || picked.length >= 3}
          onClick={() => {
            onToggle(Number(adding));
            setAdding("");
          }}
          aria-label="დამატება"
        >
          <Plus />
        </Button>
      </div>
      {chosen.map((p) => (
        <div key={p.pid} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2">
          <PlayerPhoto pid={p.pid} className="h-8 w-8 rounded-full bg-muted object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">{p.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {p.per_game.toFixed(1)} თამაშზე · {p.ros_games} თამაში დარჩა{p.injury ? ` · ${injuryLabel(p.injury)}` : ""}
            </div>
          </div>
          <span className="text-xs text-muted-foreground tabular" title="მოსალოდნელი ქულა სეზონის ბოლომდე">
            {fmt(rosValue(p))}
          </span>
          <button type="button" onClick={() => onToggle(p.pid)} className="rounded p-1 text-muted-foreground hover:text-loss" aria-label="წაშლა">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function TradeAnalyzer() {
  const { managers } = useData();
  const [a, setA] = useState(0);
  const [b, setB] = useState(Math.min(1, managers.length - 1));
  const [pa, setPa] = useState<number[]>([]);
  const [pb, setPb] = useState<number[]>([]);
  const A = managers[a];
  const B = managers[b];
  const give = (A?.roster ?? []).filter((p) => pa.includes(p.pid));
  const get = (B?.roster ?? []).filter((p) => pb.includes(p.pid));
  const sum = (xs: RosterPlayer[], f: (p: RosterPlayer) => number) => xs.reduce((n, p) => n + f(p), 0);
  // პირველი გუნდისთვის: რას იღებს მინუს რას აძლევს (დარჩენილი სეზონის ქულები)
  const delta = sum(get, rosValue) - sum(give, rosValue);
  const perGame = sum(get, (p) => p.per_game) - sum(give, (p) => p.per_game);
  const total = Math.max(1, sum(get, rosValue) + sum(give, rosValue));
  const share = 0.5 + delta / (2 * total);
  const toggle = (set: React.Dispatch<React.SetStateAction<number[]>>) => (pid: number) =>
    set((x) => (x.includes(pid) ? x.filter((y) => y !== pid) : x.length < 3 ? [...x, pid] : x));

  return (
    <Section
      icon={<ArrowLeftRight className="h-5 w-5 text-[hsl(var(--blue))]" />}
      title="ტრეიდის ანალიზი"
      sub="თითო მხარეს 3 მოთამაშემდე. ფასდება დარჩენილი სეზონის მოსალოდნელი ქულით: ქულა თამაშზე × დარჩენილი თამაშები, ტრავმის გათვალისწინებით."
    >
      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto_1fr]">
          <TradeSide
            managers={managers}
            team={a}
            picked={pa}
            onTeam={(v) => {
              setA(v);
              setPa([]);
            }}
            onToggle={toggle(setPa)}
          />
          <div className="grid place-items-center">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <TradeSide
            managers={managers}
            team={b}
            picked={pb}
            onTeam={(v) => {
              setB(v);
              setPb([]);
            }}
            onToggle={toggle(setPb)}
          />
          <div className="md:col-span-3">
            {!give.length || !get.length ? (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center text-sm text-muted-foreground">აირჩიე მოთამაშეები ორივე მხრიდან.</p>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                  <span>{clean(A.team)} იღებს</span>
                  <span>{clean(B.team)} იღებს</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="bg-[hsl(var(--red))] transition-all duration-500" style={{ width: `${share * 100}%` }} />
                  <div className="w-0.5 bg-black" />
                  <div className="flex-1 bg-[hsl(var(--blue))]" />
                </div>
                <p className="mt-3 text-center text-sm">
                  {Math.abs(delta) < 150
                    ? `თითქმის თანაბარი ტრეიდია: სხვაობა ${fmt(Math.abs(delta))} ქულა სეზონის ბოლომდე.`
                    : `${clean(delta > 0 ? A.team : B.team)} იგებს დაახლოებით ${fmt(Math.abs(delta))} ქულას სეზონის ბოლომდე (${Math.abs(perGame).toFixed(1)} ქულა თამაშზე).`}
                </p>
                {give.length !== get.length && (
                  <p className="mt-1 text-center text-xs text-muted-foreground">მოთამაშეების რაოდენობა განსხვავდება: ვინც მეტს იღებს, როსტერიდან ვინმე უნდა გაუშვას.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}

const TABS = [
  ["week", "ამ კვირა"],
  ["odds", "სეზონის შანსები"],
  ["waivers", "თავისუფალი აგენტები"],
  ["trade", "ტრეიდი"],
] as const;
type Tab = (typeof TABS)[number][0];

export default function Analytics() {
  const data = useData();
  // ჩანართი ბმულშია (?tab=odds), რომ გაზიარება და ძველი /odds ბმული სწორ ადგილას მიდიოდეს
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.some(([id]) => id === params.get("tab")) ? (params.get("tab") as Tab) : "week";
  return (
    <>
      <PageHeader title="ანალიტიკა" description="მატჩების პროგნოზი, სეზონის შანსები, თავისუფალი აგენტები და ტრეიდების შეფასება. ყველაფერი ESPN-ის მიმდინარე მონაცემებით.">
        <Updated at={data.updated_at} />
      </PageHeader>
      <div role="tablist" className="-mt-2 mb-6 flex gap-1 overflow-x-auto border-b border-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams(id === "week" ? {} : { tab: id }, { replace: true })}
            className={cn("relative whitespace-nowrap px-3 py-2.5 text-sm transition-colors", tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {label}
            {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
          </button>
        ))}
      </div>
      <div key={tab} className="page-in space-y-10">
        {tab === "week" &&
          (data.projections ? (
            <>
              <MatchupPreview />
              <GamesLeft />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">პროგნოზი ჯერ არ არის ხელმისაწვდომი.</p>
          ))}
        {tab === "odds" && (
          <div>
            <SeasonOdds />
          </div>
        )}
        {tab === "waivers" && <WaiverWatch />}
        {tab === "trade" && <TradeAnalyzer />}
      </div>
    </>
  );
}
