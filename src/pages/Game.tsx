import { useMemo, useState } from "react";
import { Copy, Dices, Flame, RotateCcw } from "lucide-react";
import { useData } from "@/lib/league";
import { headshot } from "@/lib/logos";
import { clean } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import type { LeagueData } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";

type P = { name: string; pid: number; hint: string; team?: string };
const BLUR = [26, 16, 8, 0];
const POINTS = [3, 2, 1, 0];
const KEY = "wcf-game";

/** მოთამაშეები ლიგის ისტორიიდან: დრაფტის 1-ლი რაუნდი, steal/bust-ები, MVP-ები, ახლანდელი როსტერები */
function pool(data: LeagueData): P[] {
  const m = new Map<number, P>();
  const add = (p: P) => p.pid && !m.has(p.pid) && m.set(p.pid, p);
  for (const s of data.seasons) {
    if (s.awards.mvp) add({ name: s.awards.mvp.player, pid: s.awards.mvp.pid, hint: `${s.label}-ის MVP ლიგაში` });
    for (const d of [...(s.draft?.round1 ?? []), ...(s.draft?.steals ?? []), ...(s.draft?.busts ?? [])])
      add({ name: d.player, pid: d.pid, hint: `${s.label} დრაფტი, პიკი #${d.n}`, team: d.team });
  }
  for (const mg of data.managers) for (const r of mg.roster) add({ name: r.name, pid: r.pid, hint: `${r.pos ?? ""} · ${r.pro ?? ""}`, team: mg.team });
  return [...m.values()].sort((a, b) => a.pid - b.pid);
}

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" });
function rng(seed: string) {
  let h = [...seed].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381);
  return () => ((h = (h * 1103515245 + 12345) >>> 0) % 100000) / 100000;
}

function round(list: P[], seed: string) {
  const r = rng(seed);
  const answer = list[Math.floor(r() * list.length)];
  const others = list.filter((p) => p.pid !== answer.pid);
  const opts = [answer];
  while (opts.length < 4 && others.length) opts.push(others.splice(Math.floor(r() * others.length), 1)[0]);
  return { answer, options: opts.sort(() => r() - 0.5) };
}

type Saved = { date: string; points: number | null; streak: number; best: number; total: number; tries: string[] };
function load(): Saved {
  try {
    return { date: "", points: null, streak: 0, best: 0, total: 0, tries: [], ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { date: "", points: null, streak: 0, best: 0, total: 0, tries: [] };
  }
}
function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export default function Game() {
  const data = useData();
  const list = useMemo(() => pool(data), [data]);
  const [practice, setPractice] = useState<string | null>(null);
  const [stats, setStats] = useState(load);

  if (list.length < 4) {
    return (
      <>
        <PageHeader title="ვინ არის?" />
        <p className="text-sm text-muted-foreground">თამაშისთვის მოთამაშეები დრაფტის შემდეგ დაემატება.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="ვინ არის?" description="ყოველდღე ერთი მოთამაშე ლიგის ისტორიიდან. გამოიცანი ბუნდოვანი ფოტოთი. პირველივე ცდაზე 3 ქულაა, მეორეზე 2, მესამეზე 1.">
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1">
            <Flame className="h-3 w-3 text-orange-400" /> სერია {stats.streak}
          </Badge>
          <Badge variant="secondary">ჯამი {stats.total}</Badge>
        </div>
      </PageHeader>
      {/* key — ვარჯიშიდან დღის თამაშზე (და პირიქით) გადასვლისას ყველაფერი თავიდან */}
      <Play key={practice ?? "daily"} list={list} practice={practice} setPractice={setPractice} stats={stats} setStats={setStats} />
    </>
  );
}

function Play({
  list,
  practice,
  setPractice,
  stats,
  setStats,
}: {
  list: P[];
  practice: string | null;
  setPractice: (s: string | null) => void;
  stats: Saved;
  setStats: (s: Saved) => void;
}) {
  const seed = practice ?? `wcf-${today()}`;
  const { answer, options } = useMemo(() => round(list, seed), [list, seed]);
  const daily = !practice;
  const [wrong, setWrong] = useState<number[]>(() => (daily && stats.date === today() ? stats.tries.map(Number).filter((x) => x !== answer.pid) : []));
  const [won, setWon] = useState<boolean>(() => daily && stats.date === today() && stats.tries.map(Number).includes(answer.pid));
  const done = won || wrong.length >= 3;
  const stage = done ? 3 : wrong.length;
  const [copied, setCopied] = useState(false);

  const guess = (p: P) => {
    if (done || wrong.includes(p.pid)) return;
    const ok = p.pid === answer.pid;
    const nextWrong = ok ? wrong : [...wrong, p.pid];
    if (ok) setWon(true);
    else setWrong(nextWrong);
    if (!daily) return;
    const finished = ok || nextWrong.length >= 3;
    const pts = ok ? POINTS[wrong.length] : 0;
    const prevDay = new Date(Date.now() - 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" });
    const s: Saved = {
      ...stats,
      date: today(),
      tries: [...nextWrong, ...(ok ? [p.pid] : [])].map(String),
      points: finished ? pts : null,
    };
    if (finished) {
      s.streak = pts > 0 ? (stats.date === prevDay && (stats.points ?? 0) > 0 ? stats.streak + 1 : 1) : 0;
      s.best = Math.max(stats.best, s.streak);
      s.total = stats.total + pts;
    }
    setStats(s);
    save(s);
  };

  const share = async () => {
    const squares = [...wrong.map(() => "🟥"), ...(won ? ["🟩"] : [])].join("");
    const text = `WCF „ვინ არის?“ ${today()}: ${squares} ${won ? POINTS[wrong.length] : 0}/3 🏀`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("დააკოპირე:", text);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-xl space-y-4">
        <Card className="tone-card overflow-hidden" style={tone(won ? "win" : done ? "red" : "blue")}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{practice ? "ვარჯიში" : `დღის მოთამაშე · ${today()}`}</span>
              <span>ცდა {Math.min(wrong.length + (won ? 1 : 0), 3)}/3</span>
            </div>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-950">
              <img
                src={headshot(answer.pid)}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full select-none object-contain transition-[filter] duration-700"
                style={{ filter: `blur(${BLUR[stage]}px) ${done ? "" : "grayscale(0.6) brightness(0.9)"}` }}
              />
              {!done && <div className="absolute inset-0 grid place-items-center text-6xl opacity-80">❓</div>}
            </div>

            {wrong.length >= 1 && !done && <p className="text-center text-sm text-muted-foreground">მინიშნება: {answer.hint}</p>}
            {wrong.length >= 2 && !done && answer.team && (
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                ლიგაში: <TeamAvatar name={answer.team} size={18} badge={false} /> {clean(answer.team)}
              </p>
            )}

            {done && (
              <div className="pick-pop text-center">
                <div className="text-2xl font-bold">{answer.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {won ? `🎉 სწორია! +${POINTS[wrong.length]} ქულა` : "😅 ამჯერად ვერა. ხვალ ახალი მოთამაშე!"}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {options.map((p) => {
                const isWrong = wrong.includes(p.pid);
                const isRight = done && p.pid === answer.pid;
                return (
                  <button
                    key={p.pid}
                    type="button"
                    disabled={done || isWrong}
                    onClick={() => guess(p)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-200",
                      isRight && "border-win/60 bg-win/15 text-win",
                      isWrong && "border-loss/40 bg-loss/10 text-loss line-through opacity-70",
                      !isRight && !isWrong && "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06]",
                    )}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {done && (
              <div className="flex flex-wrap justify-center gap-2">
                {daily && (
                  <Button variant="outline" className="bg-transparent" onClick={share}>
                    <Copy /> {copied ? "დაკოპირდა!" : "შედეგის გაზიარება"}
                  </Button>
                )}
                <Button variant="outline" className="bg-transparent" onClick={() => setPractice(`p-${Date.now()}`)}>
                  {practice ? <RotateCcw /> : <Dices />} {practice ? "კიდევ ერთი" : "ვარჯიში"}
                </Button>
                {practice && (
                  <Button variant="ghost" onClick={() => setPractice(null)}>
                    დღის თამაშზე დაბრუნება
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          საუკეთესო სერია: {stats.best} · ვარჯიში ქულებს არ ითვლის · მოთამაშეების ბაზა: {list.length}
        </p>
      </div>
    </>
  );
}
