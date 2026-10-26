import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Bell, CalendarCheck, CheckCheck, HeartPulse, Megaphone, ShieldCheck, UserMinus, UserPlus, X } from "lucide-react";
import type { LeagueData } from "@/types";
import { useNotifications, type Note, type NoteKind } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { clean } from "@/lib/format";
import { useMyTeam } from "@/lib/myTeam";
import { Button } from "@/components/ui/button";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

/** ხატულა და ფერი (CSS ცვლადი) თითო ტიპზე */
const KIND: Record<NoteKind, { icon: typeof Bell; color: string; label: string }> = {
  add: { icon: UserPlus, color: "--win", label: "აყვანა" },
  waiver: { icon: UserPlus, color: "--win", label: "Waiver" },
  drop: { icon: UserMinus, color: "--muted-foreground", label: "გაშვება" },
  trade: { icon: ArrowLeftRight, color: "--blue", label: "ტრეიდი" },
  trade_review: { icon: ArrowLeftRight, color: "--gold", label: "განხილვაში" },
  injury: { icon: HeartPulse, color: "--red", label: "ტრავმა" },
  healthy: { icon: ShieldCheck, color: "--win", label: "დაბრუნდა" },
  week: { icon: CalendarCheck, color: "--gold", label: "შედეგები" },
  news: { icon: Megaphone, color: "--blue", label: "განცხადება" },
};

const FILTERS: [string, string, NoteKind[]][] = [
  ["all", "ყველა", []],
  ["roster", "როსტერი", ["add", "waiver", "drop"]],
  ["trade", "ტრეიდი", ["trade", "trade_review"]],
  ["injury", "ტრავმა", ["injury", "healthy"]],
  ["week", "შედეგები", ["week"]],
];

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "ახლა";
  if (s < 3600) return `${Math.round(s / 60)} წთ`;
  if (s < 86400) return `${Math.round(s / 3600)} სთ`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} დღე`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** დღის ჯგუფი თბილისის დროით */
function bucket(iso: string) {
  const t = new Date(iso).getTime();
  if (!t) return "ადრე";
  const day = (d: number) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" });
  if (day(t) === day(Date.now())) return "დღეს";
  if (day(t) === day(Date.now() - 864e5)) return "გუშინ";
  if (Date.now() - t < 7 * 864e5) return "ამ კვირაში";
  return "ადრე";
}

/** ვის ეხება: მოთამაშის ფოტო, გუნდის ლოგო(ები) ან უბრალოდ ხატულა; კუთხეში ტიპის ხატულა */
function Avatar({ n }: { n: Note }) {
  const { icon: Icon, color } = KIND[n.kind];
  const badge = (
    <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-zinc-950" style={{ background: `hsl(var(${color}))` }}>
      <Icon className="h-2.5 w-2.5 text-black" strokeWidth={2.5} />
    </span>
  );
  if (n.pid)
    return (
      <span className="relative h-10 w-10 shrink-0">
        <PlayerPhoto pid={n.pid} className="h-10 w-10 rounded-full bg-muted" />
        {badge}
      </span>
    );
  if (n.teams?.length === 2)
    return (
      <span className="relative h-10 w-10 shrink-0">
        <span className="absolute left-0 top-0">
          <TeamAvatar name={n.teams[0]} size={26} badge={false} />
        </span>
        <span className="absolute bottom-0 right-0 rounded-full ring-2 ring-zinc-950">
          <TeamAvatar name={n.teams[1]} size={26} badge={false} />
        </span>
      </span>
    );
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: `hsl(var(${color}) / 0.14)`, color: `hsl(var(${color}))` }}>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

function Item({ n, unread, onGo }: { n: Note; unread: boolean; onGo: () => void }) {
  const { color, label } = KIND[n.kind];
  const body = (
    <div className={cn("flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]", unread && "bg-white/[0.035]")}>
      <Avatar n={n} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="font-semibold uppercase tracking-wide" style={{ color: `hsl(var(${color}))` }}>
            {label}
          </span>
          <span className="text-muted-foreground tabular">{new Date(n.at).getTime() > 0 ? ago(n.at) : ""}</span>
          {unread && <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--red))]" />}
        </div>
        <div className="mt-0.5 text-[13px] font-medium leading-snug">{n.title}</div>
        {n.body && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{n.body}</p>}
      </div>
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
  const myTid = useMyTeam();
  // რა იყო წაუკითხავი გახსნის მომენტში (გახსნისას წაკითხულად ვნიშნავთ, მაგრამ წერტილები რჩება)
  const [openedSeen, setOpenedSeen] = useState(seen);
  const box = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    // ტელეფონზე სრულ ეკრანზეა: უკანა გვერდი არ უნდა სქროლავდეს
    const lock = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      if (lock) document.body.style.overflow = prev;
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
  // "ჩემი": ჩემი გუნდის ან ჩემი მოთამაშეების შეტყობინებები
  const me = data.managers.find((x) => x.tid === myTid);
  const myPids = new Set(me?.roster.map((p) => p.pid));
  const isMine = (n: Note) => !!me && ((n.teams ?? []).some((t) => clean(t) === clean(me.team)) || (n.pid != null && myPids.has(n.pid)));
  const kinds = FILTERS.find(([id]) => id === filter)?.[2] ?? [];
  const shown = notes.filter((n) => (filter === "mine" ? isMine(n) : !kinds.length || kinds.includes(n.kind)));
  const fresh = shown.filter((n) => openedSeen && n.at > openedSeen).length;
  const groups: [string, Note[]][] = [];
  for (const n of shown) {
    const b = bucket(n.at);
    const g = groups.find(([k]) => k === b);
    if (g) g[1].push(n);
    else groups.push([b, [n]]);
  }

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
      {open &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-label="შეტყობინებები"
            className="fixed inset-0 z-[70] flex flex-col bg-zinc-950 pt-[env(safe-area-inset-top)] animate-in fade-in slide-in-from-bottom-4 sm:inset-auto sm:right-4 sm:top-[4.5rem] sm:max-h-[min(80vh,680px)] sm:w-[420px] sm:rounded-2xl sm:border sm:border-white/10 sm:pt-0 sm:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] sm:slide-in-from-top-2"
          >
            <div className="flex shrink-0 items-center gap-2 px-4 pb-3 pt-4">
              <div className="text-lg font-semibold sm:text-base">შეტყობინებები</div>
              {fresh > 0 && <span className="whitespace-nowrap rounded-full bg-[hsl(var(--red))] px-1.5 text-[11px] font-semibold text-white tabular">{fresh} ახალი</span>}
              <div className="ml-auto flex items-center gap-1">
                {fresh > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenedSeen(new Date().toISOString())}
                    aria-label="ყველა წაკითხულია"
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  >
                    <CheckCheck className="h-4 w-4" /> <span className="hidden min-[380px]:inline">წაკითხულია</span>
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} aria-label="დახურვა" className="rounded-full bg-white/[0.06] p-2 text-muted-foreground hover:text-foreground sm:bg-transparent sm:p-1.5">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(me ? [FILTERS[0], ["mine", "ჩემი", []] as (typeof FILTERS)[number], ...FILTERS.slice(1)] : FILTERS).map(([id, label, k]) => {
                const n = id === "mine" ? notes.filter(isMine).length : k.length ? notes.filter((x) => k.includes(x.kind)).length : notes.length;
                if (id !== "all" && !n) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                      filter === id ? "border-white bg-white text-black" : "border-white/10 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                    <span className={cn("tabular", filter === id ? "text-black/50" : "text-muted-foreground/60")}>{n}</span>
                  </button>
                );
              })}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/[0.06] px-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:pb-2">
              {shown.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-3 py-16 text-center text-sm text-muted-foreground">
                  <Bell className="h-6 w-6 opacity-40" />
                  ჯერ არაფერია.
                </div>
              ) : (
                groups.map(([label, list]) => (
                  <div key={label}>
                    <div className="sticky top-0 z-10 bg-zinc-950 px-3 pb-1 pt-3 text-[11px] font-medium text-muted-foreground">{label}</div>
                    {list.map((n) => (
                      <Item key={n.id} n={n} unread={!!openedSeen && n.at > openedSeen} onGo={() => setOpen(false)} />
                    ))}
                  </div>
                ))
              )}
            </div>
            <div className="hidden shrink-0 border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-muted-foreground sm:block">ESPN-იდან, ახლდება ყოველ წუთს</div>
          </div>,
          document.body,
        )}
    </div>
  );
}
