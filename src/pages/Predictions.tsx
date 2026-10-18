import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Crown, KeyRound, Lock, Save, Target, X } from "lucide-react";
import type { PickemData, PickMatchup } from "@/types";
import { useApi } from "@/lib/useApi";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";
import { login, MeChip, useMe, WhoAmI, type Me } from "@/components/league/WhoAmI";

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/pickem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error || `HTTP ${r.status}`);
  return d as { ok: true; picks: Record<string, Record<string, number>> };
}

/** "2 დღე 4 სთ" — ჩაკეტვამდე დარჩენილი დრო */
function useLeft(at: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!at) return null;
  const s = Math.max(0, Math.floor((at - now) / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d} დღე ${h} სთ` : h ? `${h} სთ ${m} წთ` : `${m} წთ`;
}

/** გუნდის ღილაკი მატჩაფში */
function Side({
  team,
  picked,
  result,
  disabled,
  onPick,
  voters,
  align,
  names,
}: {
  team: { tid: number; name: string };
  picked: boolean;
  result: "win" | "loss" | null;
  disabled: boolean;
  onPick: () => void;
  voters: number[];
  align: "left" | "right";
  names: Record<number, string>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      aria-pressed={picked}
      className={cn(
        "group/side relative flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200 sm:p-4",
        picked
          ? "border-orange-400/60 bg-gradient-to-b from-orange-500/20 to-orange-500/5 shadow-[0_10px_30px_-12px_rgba(249,115,22,0.8)]"
          : "border-white/10 bg-white/[0.02]",
        !disabled && !picked && "hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.05]",
        result === "win" && "ring-1 ring-win/50",
        result === "loss" && "opacity-55",
        disabled && "cursor-default",
      )}
    >
      {picked && (
        <span
          className="pick-pop absolute -top-2 grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-white shadow-lg"
          style={{ [align]: "-0.5rem" }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
      <div className={cn("transition-transform duration-300", picked && "scale-110", !disabled && "group-hover/side:scale-105")}>
        <TeamAvatar name={team.name} size={52} />
      </div>
      <div className="w-full truncate text-sm font-semibold">{clean(team.name)}</div>
      {result === "win" && <Badge variant="win">მოიგო</Badge>}
      {voters.length > 0 && (
        <div className="flex -space-x-1.5" title={voters.map((v) => clean(names[v] ?? "")).join(", ")}>
          {voters.map((v) => (
            <span key={v} className="rounded-full ring-2 ring-black">
              <TeamAvatar name={names[v] ?? "?"} size={20} badge={false} />
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function MatchupPick({
  m,
  pick,
  locked,
  onPick,
  all,
  names,
}: {
  m: PickMatchup;
  pick: number | undefined;
  locked: boolean;
  onPick: (tid: number) => void;
  all: Record<string, Record<string, number>>;
  names: Record<number, string>;
}) {
  const voters = (tid: number) =>
    Object.entries(all)
      .filter(([, p]) => p[m.id] === tid)
      .map(([t]) => Number(t));
  const res = (tid: number) => (m.winner == null || m.winner === 0 ? null : m.winner === tid ? "win" : "loss");
  const verdict = pick != null && m.winner != null && m.winner !== 0 ? (pick === m.winner ? "ok" : "bad") : null;
  return (
    <Card className="overflow-visible p-3 sm:p-4">
      <div className="flex items-stretch gap-2 sm:gap-3">
        <Side
          team={m.home}
          align="left"
          picked={pick === m.home.tid}
          result={res(m.home.tid)}
          disabled={locked}
          onPick={() => onPick(m.home.tid)}
          voters={locked ? voters(m.home.tid) : []}
          names={names}
        />
        <div className="flex shrink-0 flex-col items-center justify-center gap-1">
          <span className="font-mono text-xs font-bold tracking-widest text-muted-foreground">VS</span>
          {verdict === "ok" && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-win/20 text-win" title="+1">
              <Check className="h-3.5 w-3.5" />
            </span>
          )}
          {verdict === "bad" && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-loss/20 text-loss">
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <Side
          team={m.away}
          align="right"
          picked={pick === m.away.tid}
          result={res(m.away.tid)}
          disabled={locked}
          onPick={() => onPick(m.away.tid)}
          voters={locked ? voters(m.away.tid) : []}
          names={names}
        />
      </div>
    </Card>
  );
}

function adminPw() {
  try {
    return sessionStorage.getItem("wcf-admin") || "";
  } catch {
    return "";
  }
}

function Leaderboard({ data, me, onReset }: { data: PickemData; me: Me | null; onReset: () => void }) {
  const admin = adminPw();
  const reset = async (tid: number, name: string) => {
    if (!window.confirm(`გავუუქმო PIN გუნდს „${clean(name)}“? თავიდან დააყენებს.`)) return;
    try {
      await post({ action: "reset", password: admin, tid });
      onReset();
    } catch (e) {
      window.alert((e as Error).message);
    }
  };
  const anyPoints = data.leaderboard.some((r) => r.total > 0);
  const max = Math.max(1, ...data.leaderboard.map((r) => r.points));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-4 w-4 text-gold" /> პროგნოზების ცხრილი
        </CardTitle>
        <CardDescription>სწორი = +1 · იდეალური კვირა = +1 ბონუსი · 👑 = კვირის ორაკული</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {!anyPoints && <p className="pb-2 text-sm text-muted-foreground">ქულები პირველი კვირის დასრულების შემდეგ გამოჩნდება.</p>}
        {data.leaderboard.map((r, i) => (
          <div
            key={r.tid}
            className={cn(
              "grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-lg px-2 py-2",
              me?.tid === r.tid && "bg-orange-500/10 ring-1 ring-orange-400/30",
            )}
          >
            <span className={cn("text-center font-mono text-sm", i === 0 && anyPoints ? "text-gold" : "text-muted-foreground")}>{i + 1}</span>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <TeamAvatar name={r.name} size={22} badge={false} />
                <span className="truncate font-medium">{clean(r.name)}</span>
                {r.oracle > 0 && <span title="კვირის ორაკული">{"👑".repeat(Math.min(r.oracle, 3))}</span>}
                {r.perfect > 0 && (
                  <span title="იდეალური კვირა" className="text-xs text-muted-foreground">
                    💯×{r.perfect}
                  </span>
                )}
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="bar-fill h-full origin-left rounded-full bg-gradient-to-r from-orange-500 to-amber-300"
                  style={{ width: `${(r.points / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 text-right">
              {admin && data.teams.find((t) => t.tid === r.tid)?.has_pin && (
                <button
                  type="button"
                  onClick={() => reset(r.tid, r.name)}
                  title="PIN-ის გაუქმება"
                  className="rounded p-1 text-muted-foreground hover:text-loss"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                </button>
              )}
              <div>
                <div className="text-lg font-bold tabular leading-none">{r.points}</div>
                <div className="text-[10px] text-muted-foreground">{r.total ? `${r.correct}/${r.total}` : "-"}</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Predictions() {
  const [week, setWeek] = useState(0);
  const { state, reload } = useApi<PickemData>(`/api/pickem${week ? `?week=${week}` : ""}`);
  const [me, setMe] = useMe();
  const [mine, setMine] = useState<Record<string, Record<string, number>>>({});
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const data = state.status === "ready" ? state.data : null;
  const names = useMemo(() => Object.fromEntries((data?.teams ?? []).map((t) => [t.tid, t.name])) as Record<number, string>, [data]);
  const left = useLeft(data?.lock_at ?? null);

  // შენახული შესვლით — ჩემი პროგნოზების წამოღება
  useEffect(() => {
    if (!me) return;
    login(me)
      .then((d) => setMine(d.picks))
      .catch(() => setMe(null));
  }, [me, setMe]);

  const saved = data ? (mine[String(data.week)] ?? {}) : {};
  useEffect(() => setDraft(saved), [JSON.stringify(saved), data?.week]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const complete = data ? data.matchups.every((m) => draft[m.id] != null) : false;

  const save = async () => {
    if (!me || !data) return;
    setBusy(true);
    setMsg(null);
    try {
      const d = await post({
        action: "pick",
        ...me,
        week: data.week,
        picks: draft,
      });
      setMine(d.picks);
      setMsg({ ok: true, text: "პროგნოზი შენახულია 🏀" });
      window.setTimeout(() => setMsg((m) => (m?.ok ? null : m)), 3500);
      reload();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const meTeam = data?.teams.find((t) => t.tid === me?.tid);
  const oracleNames = data?.oracle?.tids.map((t) => clean(names[t] ?? "")).join(", ");

  return (
    <>
      <PageHeader
        title="პროგნოზები"
        description="ყოველ კვირას გამოიცანი მატჩაფების გამარჯვებულები. სწორი პროგნოზი +1 ქულაა, თუ ყველა გამოიცანი, +1 ბონუსი. პროგნოზი კვირის პირველ თამაშზე იკეტება."
      >
        {me && meTeam && <MeChip name={meTeam.name} onLogout={() => setMine({})} />}
      </PageHeader>

      {state.status === "loading" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      )}
      {state.status === "error" && <p className="text-sm text-loss">ვერ ჩაიტვირთა: {state.message}</p>}

      {data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="space-y-4">
            {data.oracle && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-sm">
                <span className="text-2xl">👑</span>
                <span>
                  კვირა {data.oracle.week}-ის ორაკული: <b>{oracleNames}</b> ({data.oracle.correct}/{data.oracle.of} სწორი)
                </span>
              </div>
            )}

            {/* კვირის არჩევა */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="წინა კვირა" disabled={data.week <= 1} onClick={() => setWeek(data.week - 1)}>
                  <ChevronLeft />
                </Button>
                <div className="min-w-[110px] text-center">
                  <div className="text-lg font-semibold">კვირა {data.week}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {data.week === data.open_week ? "ღიაა პროგნოზისთვის" : data.locked ? "ჩაკეტილია" : "მომავალი"}
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="შემდეგი კვირა" disabled={data.week >= data.weeks} onClick={() => setWeek(data.week + 1)}>
                  <ChevronRight />
                </Button>
              </div>
              {data.locked ? (
                <Badge variant="secondary" className="gap-1.5">
                  <Lock className="h-3 w-3" /> ჩაკეტილია
                </Badge>
              ) : (
                left && (
                  <Badge className="gap-1.5 border-orange-500/30 bg-orange-500/15 text-orange-200 hover:bg-orange-500/15">
                    <Lock className="h-3 w-3" /> ჩაიკეტება {left}-ში
                  </Badge>
                )
              )}
            </div>

            {!me && !data.locked && <WhoAmI teams={data.teams} onLogin={setMine} />}

            {data.matchups.length === 0 ? (
              <p className="text-sm text-muted-foreground">ამ კვირის მატჩაფები ჯერ არ არის.</p>
            ) : (
              <div className="space-y-3">
                {data.matchups.map((m) => (
                  <MatchupPick
                    key={m.id}
                    m={m}
                    pick={draft[m.id]}
                    locked={data.locked || !me}
                    all={data.picks}
                    names={names}
                    onPick={(tid) => setDraft((d) => ({ ...d, [m.id]: tid }))}
                  />
                ))}
              </div>
            )}

            {me && !data.locked && data.matchups.length > 0 && (
              <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950/85 p-3 backdrop-blur-xl">
                <span className="text-sm text-muted-foreground">
                  {Object.keys(draft).length}/{data.matchups.length} არჩეული
                  {!dirty && Object.keys(saved).length > 0 && <span className="ml-2 text-win">· შენახულია ✓</span>}
                </span>
                <Button onClick={save} disabled={busy || !dirty || !Object.keys(draft).length}>
                  <Save /> {complete ? "შენახვა" : "შენახვა (ნაწილობრივ)"}
                </Button>
              </div>
            )}

            {msg && (
              <div className={cn("rounded-lg border p-3 text-sm", msg.ok ? "border-win/30 bg-win/10 text-win" : "border-loss/30 bg-loss/10 text-loss")}>
                {msg.text}
              </div>
            )}

            {/* ვინ გააკეთა პროგნოზი */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              {data.submitted.length ? "პროგნოზი გააკეთა:" : "ამ კვირაზე პროგნოზი ჯერ არავის გაუკეთებია."}
              {data.submitted.map((t) => (
                <span key={t} title={clean(names[t] ?? "")}>
                  <TeamAvatar name={names[t] ?? "?"} size={22} badge={false} />
                </span>
              ))}
              {!data.locked && data.submitted.length > 0 && <span className="text-xs">(არჩევანი ჩაკეტვის შემდეგ გამოჩნდება)</span>}
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <Leaderboard data={data} me={me} onReset={reload} />
            <p className="px-1 text-xs text-muted-foreground">
              PIN დაგავიწყდა? მიწერე კომისარს და გაგიუქმებს.{" "}
              <Link to="/rules" className="underline underline-offset-2">
                ლიგის წესები
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
