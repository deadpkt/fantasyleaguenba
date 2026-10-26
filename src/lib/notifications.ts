import { useEffect, useMemo, useState } from "react";
import type { LeagueData } from "@/types";
import { clean } from "@/lib/format";

/** შეტყობინებების ლენტი. წყაროები:
 *  - ESPN-ის აქტივობა (აყვანა, გაშვება, ტრეიდი) — ზუსტი დროით, სერვერიდან;
 *  - ტრავმის სტატუსის ცვლილება და კვირის შედეგები — ESPN დროს არ გვაძლევს, ამიტომ
 *    ბრაუზერი იმახსოვრებს, რა იყო ბოლოს, და ცვლილებას იმ წამს აფიქსირებს, როცა შეამჩნია. */
export type NoteKind = "add" | "waiver" | "drop" | "trade" | "trade_review" | "injury" | "healthy" | "week" | "news";

export interface Note {
  id: string;
  kind: NoteKind;
  at: string;
  title: string;
  body?: string;
  to?: string;
  /** ვის ეხება: მოთამაშის ფოტო ან გუნდების ლოგოები */
  pid?: number;
  teams?: string[];
}

const SEEN_KEY = "wcf-notes-seen";
const SNAP_KEY = "wcf-notes-snapshot";
const LOCAL_KEY = "wcf-notes-local";

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private mode */
  }
};

const status = (s: string) => s.replace(/_/g, " ");
const names = (list: { name: string }[]) => list.map((p) => p.name).join(", ");

type Snapshot = { injuries: Record<string, string>; weeks: number[] };

/** ტრავმები და კვირის შედეგები: წინა მდგომარეობასთან შედარება */
function detectChanges(data: LeagueData): Note[] {
  const now = new Date().toISOString();
  const first = read<Snapshot | null>(SNAP_KEY, null) == null;
  const snap = read<Snapshot>(SNAP_KEY, { injuries: {}, weeks: [] });
  const local = read<Note[]>(LOCAL_KEY, []);
  const fresh: Note[] = [];

  const injuries: Record<string, string> = {};
  const owner: Record<string, { name: string; team: string }> = {};
  for (const m of data.managers)
    for (const p of m.roster) {
      owner[p.pid] = { name: p.name, team: clean(m.team) };
      if (p.injury) injuries[p.pid] = p.injury;
    }
  if (!first) {
    for (const [pid, s] of Object.entries(injuries))
      if (snap.injuries[pid] !== s)
        fresh.push({
          id: `inj-${pid}-${s}-${now.slice(0, 13)}`,
          kind: "injury",
          at: now,
          title: `${owner[pid].name}: ${status(s)}`,
          body: snap.injuries[pid] ? `${owner[pid].team}. ადრე: ${status(snap.injuries[pid])}` : owner[pid].team,
          to: `/player/${pid}`,
          pid: Number(pid),
        });
    for (const [pid, s] of Object.entries(snap.injuries))
      if (!injuries[pid] && owner[pid])
        fresh.push({
          id: `ok-${pid}-${now.slice(0, 13)}`,
          kind: "healthy",
          at: now,
          title: `${owner[pid].name} დაბრუნდა`,
          body: `${owner[pid].team}. ადრე: ${status(s)}`,
          to: `/player/${pid}`,
          pid: Number(pid),
        });
  }

  // დასრულებული კვირები
  const done = [...new Set(data.current.schedule.filter((g) => g.done).map((g) => g.p))];
  for (const w of done)
    if (!snap.weeks.includes(w)) {
      const games = data.current.schedule.filter((g) => g.p === w && g.done);
      fresh.push({
        id: `week-${data.current.label}-${w}`,
        kind: "week",
        // პირველ გახსნაზე ძველი კვირები "წაკითხულად" ჩაითვლება
        at: first ? new Date(0).toISOString() : now,
        title: `კვირა ${w} დასრულდა`,
        body: games.map((g) => (g.hs >= g.as ? `${clean(g.h)} ${g.hs}:${g.as} ${clean(g.a)}` : `${clean(g.a)} ${g.as}:${g.hs} ${clean(g.h)}`)).join(" · "),
        to: "/standings",
      });
    }

  write(SNAP_KEY, { injuries, weeks: done });
  if (!fresh.length) return local;
  const ids = new Set(local.map((n) => n.id));
  const merged = [...fresh.filter((n) => !ids.has(n.id)), ...local].slice(0, 40);
  write(LOCAL_KEY, merged);
  return merged;
}

export function useNotifications(data?: LeagueData) {
  const [seen, setSeen] = useState(() => read<string>(SEEN_KEY, ""));
  const [local, setLocal] = useState<Note[]>(() => read<Note[]>(LOCAL_KEY, []));

  useEffect(() => {
    if (data) setLocal(detectChanges(data));
  }, [data]);

  const notes = useMemo(() => {
    const out: Note[] = [...local];
    for (const a of data?.activity ?? []) {
      if (a.kind === "trade" || a.kind === "trade_review") {
        const [x, y] = a.sides ?? [];
        if (!x || !y) continue;
        out.push({
          id: a.id,
          kind: a.kind,
          at: a.date,
          title: a.kind === "trade" ? `ტრეიდი: ${clean(x.team)} ↔ ${clean(y.team)}` : `ტრეიდი განხილვაშია: ${clean(x.team)} ↔ ${clean(y.team)}`,
          body: `${clean(x.team)} გასცა ${names(x.gives)}, ${clean(y.team)} გასცა ${names(y.gives)}`,
          to: "/trades",
          teams: [x.team, y.team],
        });
      } else {
        const team = clean(a.team ?? "");
        const added = a.added ?? [];
        const dropped = a.dropped ?? [];
        out.push({
          id: a.id,
          kind: a.kind,
          at: a.date,
          title: added.length ? `${team} აიყვანა ${names(added)}` : `${team} გაუშვა ${names(dropped)}`,
          body: added.length && dropped.length ? `გაუშვა ${names(dropped)}` : a.kind === "waiver" ? "waiver-იდან" : undefined,
          to: added[0] ? `/player/${added[0].pid}` : a.tid != null ? `/team/${a.tid}` : undefined,
          pid: (added[0] ?? dropped[0])?.pid,
          teams: a.team ? [a.team] : undefined,
        });
      }
    }
    const unique = new Map(out.map((n) => [n.id, n]));
    return [...unique.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
  }, [local, data?.activity]);

  // პირველ გახსნაზე ყველაფერი ძველი წაკითხულია, ახლიდან ითვლება
  useEffect(() => {
    if (!seen && notes.length) {
      const now = new Date().toISOString();
      write(SEEN_KEY, now);
      setSeen(now);
    }
  }, [seen, notes.length]);

  const unread = notes.filter((n) => seen && n.at > seen).length;
  const markSeen = () => {
    const now = new Date().toISOString();
    write(SEEN_KEY, now);
    setSeen(now);
  };
  return { notes, unread, seen, markSeen };
}
