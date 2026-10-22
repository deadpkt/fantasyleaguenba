import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Bell, CalendarCheck, HeartPulse, Megaphone, ShieldCheck, UserMinus, UserPlus, X } from "lucide-react";
import type { LeagueData } from "@/types";
import { useNotifications, type Note, type NoteKind } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** ხატულა და ფერი (CSS ცვლადი) თითო ტიპზე */
const KIND: Record<NoteKind, { icon: typeof Bell; color: string }> = {
  add: { icon: UserPlus, color: "--win" },
  waiver: { icon: UserPlus, color: "--win" },
  drop: { icon: UserMinus, color: "--muted-foreground" },
  trade: { icon: ArrowLeftRight, color: "--blue" },
  trade_review: { icon: ArrowLeftRight, color: "--gold" },
  injury: { icon: HeartPulse, color: "--red" },
  healthy: { icon: ShieldCheck, color: "--win" },
  week: { icon: CalendarCheck, color: "--gold" },
  news: { icon: Megaphone, color: "--blue" },
};

const FILTERS: [string, string, NoteKind[]][] = [
  ["all", "ყველა", []],
  ["roster", "როსტერი", ["add", "waiver", "drop"]],
  ["trade", "ტრეიდი", ["trade", "trade_review"]],
  ["injury", "ტრავმა", ["injury", "healthy"]],
  ["news", "სხვა", ["week", "news"]],
];

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "ახლა";
  if (s < 3600) return `${Math.round(s / 60)} წთ`;
  if (s < 86400) return `${Math.round(s / 3600)} სთ`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} დღე`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Item({ n, unread, onGo }: { n: Note; unread: boolean; onGo: () => void }) {
  const { icon: Icon, color } = KIND[n.kind];
  const body = (
    <div className={cn("flex gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]", unread && "bg-white/[0.03]")}>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: `hsl(var(${color}) / 0.14)`, color: `hsl(var(${color}))` }}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className="flex-1 text-[13px] font-medium leading-snug">{n.title}</span>
          <span className="shrink-0 pt-0.5 text-[10px] text-muted-foreground tabular">{new Date(n.at).getTime() > 0 ? ago(n.at) : ""}</span>
        </div>
        {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
      </div>
      {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--red))]" />}
    </div>
  );
  return n.to ? (
    <Link to={n.to} onClick={onGo} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function NotificationBell({ data }: { data?: LeagueData }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const { notes, unread, seen, markSeen } = useNotifications(data);
  // რა იყო წაუკითხავი გახსნის მომენტში (გახსნისას წაკითხულად ვნიშნავთ, მაგრამ წერტილები რჩება)
  const [openedSeen, setOpenedSeen] = useState(seen);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!data) return null;
  const toggle = () => {
    if (!open) {
      setOpenedSeen(seen);
      markSeen();
    }
    setOpen(!open);
  };
  const kinds = FILTERS.find(([id]) => id === filter)![2];
  const shown = notes.filter((n) => !kinds.length || kinds.includes(n.kind));

  return (
    <div ref={box} className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative h-9 w-9 rounded-xl bg-transparent"
        aria-label={`შეტყობინებები${unread ? `, ${unread} ახალი` : ""}`}
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[hsl(var(--red))] px-1 text-[10px] font-semibold text-white tabular">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl animate-in fade-in slide-in-from-top-2 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
          <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
            <div className="text-sm font-semibold">შეტყობინებები</div>
            <button type="button" onClick={() => setOpen(false)} aria-label="დახურვა" className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs transition-colors", filter === id ? "bg-white text-black" : "bg-white/[0.06] text-muted-foreground hover:text-foreground")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto border-t border-white/[0.06] p-1.5">
            {shown.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">ჯერ არაფერია.</p>
            ) : (
              shown.map((n) => <Item key={n.id} n={n} unread={!!openedSeen && n.at > openedSeen} onGo={() => setOpen(false)} />)
            )}
          </div>
          <div className="border-t border-white/[0.06] px-4 py-2 text-[11px] text-muted-foreground">ESPN-იდან, ახლდება ყოველ წუთს</div>
        </div>
      )}
    </div>
  );
}
