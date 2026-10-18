import { useMemo, useState, type FormEvent } from "react";
import { Flame, Lock, LockOpen, Plus, Send, Trash2, Vote, X } from "lucide-react";
import type { CommunityData, Poll, WallPost } from "@/types";
import { useData } from "@/lib/league";
import { useApi } from "@/lib/useApi";
import { ago } from "@/lib/useNews";
import { clean } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";
import { Reactions } from "@/components/league/announcement";
import { MeChip, useMe, WhoAmI, type Me } from "@/components/league/WhoAmI";

const MAX = 280;

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

function adminPw() {
  try {
    return sessionStorage.getItem("wcf-admin") || "";
  } catch {
    return "";
  }
}

/* ───────────── ტრეშ-თოქი ───────────── */

function Composer({ me, teams, onSent }: { me: Me; teams: { tid: number; name: string }[]; onSent: () => void }) {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await post({ action: "wall_post", ...me, text, target });
      setText("");
      setTarget(null);
      onSent();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const left = MAX - text.length;
  return (
    <Card className="tone-card" style={tone("red")}>
      <form onSubmit={send} className="space-y-3 p-4 sm:p-5">
        <Textarea
          id="wall-text"
          value={text}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="დაწერე რამე მწარე… 🔥"
          className="min-h-[80px] resize-none border-white/10 bg-black/30 text-base"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">ვის ეხება?</span>
          {teams
            .filter((t) => t.tid !== me.tid)
            .map((t) => (
              <button
                key={t.tid}
                type="button"
                title={clean(t.name)}
                onClick={() => setTarget(target === t.tid ? null : t.tid)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  target === t.tid ? "scale-110 ring-2 ring-[hsl(var(--red))]" : "opacity-60 hover:opacity-100",
                )}
              >
                <TeamAvatar name={t.name} size={26} badge={false} />
              </button>
            ))}
          <div className="ml-auto flex items-center gap-3">
            <span className={cn("font-mono text-xs tabular-nums", left < 30 ? "text-loss" : "text-muted-foreground")}>{left}</span>
            <Button type="submit" disabled={busy || !text.trim()} className="gap-1.5">
              <Send /> გასროლა
            </Button>
          </div>
        </div>
        {err && <p className="text-sm text-loss">{err}</p>}
      </form>
    </Card>
  );
}

function Message({ p, i, names, me, onDelete }: { p: WallPost; i: number; names: Record<number, string>; me: Me | null; onDelete: () => void }) {
  const admin = adminPw();
  const mine = me?.tid === p.tid;
  const del = async () => {
    if (!window.confirm("წავშალო ეს მესიჯი?")) return;
    try {
      await post(mine && me ? { action: "wall_delete", ...me, id: p.id } : { action: "wall_delete", password: admin, id: p.id });
      onDelete();
    } catch (e) {
      window.alert((e as Error).message);
    }
  };
  return (
    <Card className={cn("pass-in", mine && "border-orange-400/25")} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
      <div className="flex gap-3 p-4">
        <TeamAvatar name={names[p.tid] ?? "?"} size={40} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-semibold">{clean(names[p.tid] ?? "?")}</span>
            {p.target != null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-[hsl(var(--red))]" />
                <TeamAvatar name={names[p.target] ?? "?"} size={18} badge={false} />
                <span className="text-foreground/80">{clean(names[p.target] ?? "?")}</span>
              </span>
            )}
            <span className="text-xs text-muted-foreground">· {ago(p.created)}</span>
            {(mine || admin) && (
              <button type="button" onClick={del} aria-label="წაშლა" className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:text-loss">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="whitespace-pre-line break-words text-[15px] leading-relaxed">{p.text}</p>
          <Reactions id={p.id} initial={p.reactions} endpoint="/api/community" action="wall_react" />
        </div>
      </div>
    </Card>
  );
}

/* ───────────── გამოკითხვები ───────────── */

function PollCard({ p, me, names, onChange }: { p: Poll; me: Me | null; names: Record<number, string>; onChange: () => void }) {
  const admin = adminPw();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const votes = Object.entries(p.votes).map(([t, o]) => [Number(t), o] as const);
  const total = votes.length;
  const myVote = me ? p.votes[String(me.tid)] : undefined;
  const top = Math.max(0, ...p.options.map((_, i) => votes.filter(([, o]) => o === i).length));

  const vote = async (option: number) => {
    if (!me || p.closed) return;
    setBusy(true);
    setErr("");
    try {
      await post({ action: "vote", ...me, id: p.id, option });
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const adminAct = async (action: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      await post({ action, password: admin, id: p.id });
      onChange();
    } catch (e) {
      window.alert((e as Error).message);
    }
  };

  return (
    <Card className={cn("tone-card", p.closed && "opacity-80")} style={tone(p.closed ? "blue" : "gold")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription className="flex items-center gap-2">
              {p.closed ? (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" /> დახურულია
                </Badge>
              ) : (
                <Badge variant="gold" className="gap-1">
                  <Vote className="h-3 w-3" /> ღიაა
                </Badge>
              )}
              <span>
                {total} ხმა · {ago(p.created)}
              </span>
            </CardDescription>
            <CardTitle className="text-xl leading-snug">{p.q}</CardTitle>
          </div>
          {admin && (
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" aria-label={p.closed ? "გახსნა" : "დახურვა"} onClick={() => adminAct("poll_close")}>
                {p.closed ? <LockOpen /> : <Lock />}
              </Button>
              <Button variant="ghost" size="icon" aria-label="წაშლა" className="text-loss hover:text-loss" onClick={() => adminAct("poll_delete", `წავშალო „${p.q}“?`)}>
                <Trash2 />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {p.options.map((o, i) => {
          const who = votes.filter(([, v]) => v === i).map(([t]) => t);
          const pct = total ? Math.round((who.length / total) * 100) : 0;
          const lead = who.length > 0 && who.length === top;
          return (
            <button
              key={i}
              type="button"
              disabled={!me || p.closed || busy}
              onClick={() => vote(i)}
              className={cn(
                "group/o relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                myVote === i ? "border-orange-400/60" : "border-white/10",
                me && !p.closed && "hover:border-white/30",
                (!me || p.closed) && "cursor-default",
              )}
            >
              <div
                className={cn("absolute inset-y-0 left-0 origin-left transition-[width] duration-700 ease-out", lead ? "bg-amber-400/20" : "bg-white/[0.06]", myVote === i && "bg-orange-500/25")}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center gap-3">
                <span className="flex-1 font-medium">
                  {o} {myVote === i && <span className="text-orange-300">✓</span>}
                </span>
                <span className="flex -space-x-1.5">
                  {who.map((t) => (
                    <span key={t} title={clean(names[t] ?? "")} className="rounded-full ring-2 ring-black">
                      <TeamAvatar name={names[t] ?? "?"} size={20} badge={false} />
                    </span>
                  ))}
                </span>
                <span className="w-10 text-right font-mono text-sm tabular-nums">{pct}%</span>
              </div>
            </button>
          );
        })}
        {err && <p className="text-sm text-loss">{err}</p>}
        {!me && !p.closed && <p className="text-xs text-muted-foreground">ხმის მისაცემად ზემოთ შედი შენი გუნდით.</p>}
      </CardContent>
    </Card>
  );
}

function NewPoll({ onCreated }: { onCreated: () => void }) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await post({ action: "poll_create", password: adminPw(), q, options: opts.filter((o) => o.trim()) });
      setQ("");
      setOpts(["", ""]);
      onCreated();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="border-dashed">
      <form onSubmit={submit} className="space-y-3 p-4 sm:p-5">
        <div className="text-sm font-medium">ახალი გამოკითხვა (კომისარი)</div>
        <Input id="poll-q" placeholder="კითხვა, მაგ. ვინ მოიგებს ტიტულს?" value={q} maxLength={160} onChange={(e) => setQ(e.target.value)} />
        {opts.map((o, i) => (
          <div key={i} className="flex gap-2">
            <Input
              id={`poll-o${i}`}
              placeholder={`ვარიანტი ${i + 1}`}
              value={o}
              maxLength={80}
              onChange={(e) => setOpts(opts.map((x, k) => (k === i ? e.target.value : x)))}
            />
            {opts.length > 2 && (
              <Button type="button" variant="ghost" size="icon" aria-label="წაშლა" onClick={() => setOpts(opts.filter((_, k) => k !== i))}>
                <X />
              </Button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" className="bg-transparent" disabled={opts.length >= 8} onClick={() => setOpts([...opts, ""])}>
            <Plus /> ვარიანტი
          </Button>
          <Button type="submit" disabled={busy || !q.trim() || opts.filter((o) => o.trim()).length < 2}>
            გამოქვეყნება
          </Button>
        </div>
        {err && <p className="text-sm text-loss">{err}</p>}
      </form>
    </Card>
  );
}

/* ───────────── გვერდი ───────────── */

export default function Club() {
  const { managers } = useData();
  const { state, reload } = useApi<CommunityData>("/api/community", 20_000);
  const [me, setMe] = useMe();
  const teams = useMemo(() => managers.map((m) => ({ tid: m.tid, name: m.team })), [managers]);
  const names = useMemo(() => Object.fromEntries(teams.map((t) => [t.tid, t.name])) as Record<number, string>, [teams]);
  const meName = me ? names[me.tid] : undefined;
  const data = state.status === "ready" ? state.data : null;
  const open = data?.polls.filter((p) => !p.closed).length ?? 0;

  return (
    <>
      <PageHeader title="კლუბი" description="ტრეშ-თოქი და გამოკითხვები მენეჯერებს შორის. იგივე გუნდით და PIN-ით შედიხარ, რითაც პროგნოზებში.">
        {me && meName && <MeChip name={meName} onLogout={() => setMe(null)} />}
      </PageHeader>

      {!me && <div className="mb-6"><WhoAmI teams={teams} /></div>}

      {state.status === "loading" && <Skeleton className="h-64" />}
      {state.status === "error" && <p className="text-sm text-loss">ვერ ჩაიტვირთა: {state.message}</p>}

      {data && (
        <Tabs defaultValue="wall">
          <TabsList>
            <TabsTrigger value="wall" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" /> ტრეშ-თოქი
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-1.5">
              <Vote className="h-3.5 w-3.5" /> გამოკითხვები {open > 0 && <Badge variant="gold" className="ml-1 px-1.5 py-0">{open}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wall" className="space-y-3">
            {me && <Composer me={me} teams={teams} onSent={reload} />}
            {data.wall.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">ჯერ სიჩუმეა… პირველი შენ დაიწყე 🔥</p>
            ) : (
              data.wall.map((p, i) => <Message key={p.id} p={p} i={i} names={names} me={me} onDelete={reload} />)
            )}
          </TabsContent>

          <TabsContent value="polls" className="space-y-4">
            {adminPw() && <NewPoll onCreated={reload} />}
            {data.polls.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">გამოკითხვები ჯერ არ არის.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.polls.map((p) => (
                  <PollCard key={p.id} p={p} me={me} names={names} onChange={reload} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
