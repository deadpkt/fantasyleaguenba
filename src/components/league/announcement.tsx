import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Megaphone, Pin, SmilePlus } from "lucide-react";
import type { Announcement } from "@/types";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ShareButton from "@/components/league/ShareButton";

/** კალათბურთის ბურთი (SVG) */
export function Ball({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="0.55" stopColor="#f97316" />
          <stop offset="1" stopColor="#9a3412" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#${id})`} />
      <g fill="none" stroke="#1c1210" strokeWidth="1.1" strokeLinecap="round">
        <circle cx="12" cy="12" r="11" />
        <path d="M1 12h22M12 1v22M4.3 4.6c3 3.4 3 11.4 0 14.8M19.7 4.6c-3 3.4-3 11.4 0 14.8" />
      </g>
    </svg>
  );
}

/** სროლა: ბურთი რკალით ფრენს და კალათში ვარდება ("swish") */
export function ShotScene({ className }: { className?: string }) {
  return (
    <div className={cn("shot-scene relative h-28 w-56 shrink-0", className)} aria-hidden>
      {/* იატაკი */}
      <div className="absolute inset-x-0 bottom-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {/* ფარი + დგამი */}
      <div className="absolute right-1 top-3 h-[92px] w-[3px] rounded-full bg-white/15" />
      <div className="absolute right-[3px] top-5 h-12 w-[5px] rounded-sm border border-white/40 bg-white/5" />
      {/* ბურთი */}
      <div className="shot-x absolute left-2 top-[78px]">
        <div className="shot-y">
          <Ball className="shot-spin h-[22px] w-[22px] drop-shadow-[0_4px_10px_rgba(249,115,22,0.45)]" />
        </div>
      </div>
      {/* რკალი + ბადე (ბურთის თავზე, რომ შიგნით ჩავარდნა ჩანდეს) */}
      <div className="absolute right-2 top-[54px] z-10 h-[3px] w-10 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
      <svg viewBox="0 0 40 22" className="shot-net absolute right-2 top-[56px] z-10 h-[22px] w-10" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1">
        <path d="M1 0 L7 21 M10 0 L13 21 M20 0 V21 M30 0 L27 21 M39 0 L33 21 M3 7 H37 M5 14 H35 M7 21 H33" />
      </svg>
      {/* SWISH */}
      <span className="shot-text absolute right-0 top-0 font-mono text-[11px] font-bold tracking-[0.25em] text-orange-400">SWISH</span>
    </div>
  );
}

export function fmtAnnDate(a: Announcement) {
  const d = a.created || a.date;
  if (!d) return "";
  const t = new Date(d);
  return isNaN(+t) ? d : t.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
}

export const isNew = (a: Announcement) => !!a.created && Date.now() - +new Date(a.created) < 3 * 864e5;

export const EMOJIS = ["🔥", "🏀", "😂", "👏", "😮", "💀"] as const;
const MINE_KEY = "wcf-reacted";

function readMine(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(MINE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function writeMine(s: Set<string>) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify([...s]));
  } catch {
    /* private mode */
  }
}

const LABELS: Record<string, string> = { "🔥": "ცეცხლი", "🏀": "Swish", "😂": "სასაცილო", "👏": "ბრავო", "😮": "ვაუ", "💀": "მოკვდა" };

/** ემოჯი-რეაქციები: "+" ღილაკი ხსნის არჩევანს, აბრები აჩვენებს რაოდენობას */
export function Reactions({
  id,
  initial,
  endpoint = "/api/announcements",
  action = "react",
}: {
  id: string;
  initial?: Record<string, number>;
  /** სად ინახება: განცხადებები ან ტრეშ-თოქი */
  endpoint?: string;
  action?: string;
}) {
  const [counts, setCounts] = useState<Record<string, number>>(initial ?? {});
  const [mine, setMine] = useState<Set<string>>(readMine);
  const [burst, setBurst] = useState<{ emoji: string; n: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(initial ?? {});
  useEffect(() => setCounts(JSON.parse(key)), [key]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = async (emoji: string) => {
    setOpen(false);
    setErr("");
    const k = `${id}|${emoji}`;
    const on = !mine.has(k);
    const delta = on ? 1 : -1;
    const flip = (add: boolean) =>
      setMine((m) => {
        const n = new Set(m);
        if (add) n.add(k);
        else n.delete(k);
        writeMine(n);
        return n;
      });
    flip(on);
    setCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 0) + delta) }));
    if (on) setBurst({ emoji, n: Date.now() });
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, emoji, delta }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || typeof d.count !== "number") throw new Error(d.error || `HTTP ${r.status}`);
      setCounts((c) => ({ ...c, [emoji]: d.count }));
    } catch (e) {
      // ვერ შეინახა — ვაბრუნებთ და ვაჩვენებთ რატომ
      setCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 0) - delta) }));
      flip(!on);
      setErr(`რეაქცია ვერ შეინახა: ${(e as Error).message}`);
    }
  };

  const shown = EMOJIS.filter((e) => (counts[e] ?? 0) > 0 || mine.has(`${id}|${e}`));

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map((e) => {
          const n = counts[e] ?? 0;
          const active = mine.has(`${id}|${e}`);
          return (
            <button
              key={e}
              type="button"
              onClick={() => toggle(e)}
              aria-pressed={active}
              title={LABELS[e]}
              className={cn(
                "relative flex h-8 items-center gap-1.5 rounded-full border pl-2 pr-2.5 text-[15px] backdrop-blur-md transition-all duration-200 active:scale-90",
                active
                  ? "border-orange-400/50 bg-gradient-to-b from-orange-500/25 to-orange-600/10 shadow-[0_0_0_1px_rgba(251,146,60,0.15),0_6px_20px_-6px_rgba(249,115,22,0.6)]"
                  : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]",
              )}
            >
              <span key={active ? `${e}-on` : e} className={cn("inline-block leading-none", active && "react-pop")}>
                {e}
              </span>
              <span key={n} className={cn("react-count font-mono text-xs font-semibold tabular-nums", active ? "text-orange-200" : "text-muted-foreground")}>
                {n}
              </span>
              {burst?.emoji === e && (
                <span key={burst.n} className="pointer-events-none absolute inset-0" onAnimationEnd={() => setBurst(null)}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="react-float absolute left-2 top-0 text-base" style={{ animationDelay: `${i * 90}ms`, ["--dx" as string]: `${(i - 1) * 14}px` }}>
                      {e}
                    </span>
                  ))}
                  <span className="react-ring absolute inset-0 rounded-full border border-orange-400/70" />
                </span>
              )}
            </button>
          );
        })}

        {/* რეაქციის დამატება */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="რეაქციის დამატება"
          className={cn(
            "group/add flex h-8 items-center gap-1 rounded-full border px-2.5 text-muted-foreground transition-all duration-200 hover:border-white/25 hover:bg-white/[0.06] hover:text-foreground",
            open ? "border-white/25 bg-white/[0.08] text-foreground" : "border-dashed border-white/15",
          )}
        >
          <SmilePlus className="h-4 w-4 transition-transform duration-300 group-hover/add:rotate-12 group-hover/add:scale-110" />
          {!shown.length && <span className="text-xs">რეაქცია</span>}
        </button>
      </div>

      {/* არჩევანი */}
      {open && (
        <div
          role="menu"
          className="react-picker absolute bottom-full left-0 z-30 mb-2 flex items-center gap-0.5 rounded-2xl border border-white/15 bg-zinc-900/80 p-1.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
        >
          {EMOJIS.map((e, i) => (
            <button
              key={e}
              type="button"
              role="menuitem"
              onClick={() => toggle(e)}
              aria-label={LABELS[e]}
              className={cn(
                "react-option group/o relative grid h-10 w-10 place-items-center rounded-xl text-[22px] transition-all duration-150 hover:-translate-y-1.5 hover:scale-125 hover:bg-white/10 active:scale-95",
                mine.has(`${id}|${e}`) && "bg-orange-500/20",
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {e}
              <span className="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md bg-black/90 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover/o:opacity-100">
                {LABELS[e]}
              </span>
            </button>
          ))}
        </div>
      )}
      {err && <p className="mt-2 text-xs text-loss">{err}</p>}
    </div>
  );
}

const ACCENT = { gold: "from-amber-300 to-amber-600", red: "from-orange-400 to-[hsl(var(--red))]", blue: "from-sky-400 to-[hsl(var(--blue))]" } as const;

/** კალენდრის ფურცელივით: ზემოთ ფერადი ზოლი თვით, ქვემოთ დიდი რიცხვი */
export function DateTile({ a, tone: t, big }: { a: Announcement; tone: keyof typeof ACCENT; big?: boolean }) {
  const [day, mon] = fmtAnnDate(a).split(" ");
  return (
    <div className={cn("flex shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/60 text-center shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)]", big ? "w-16" : "w-12")}>
      <span className={cn("bg-gradient-to-b py-0.5 font-mono text-[9px] font-bold tracking-widest text-black", ACCENT[t])}>{mon || "-"}</span>
      <span className={cn("py-1 font-extrabold leading-none tabular", big ? "text-2xl" : "text-lg")}>{day || "-"}</span>
    </div>
  );
}

/** განცხადების ბარათი — გამოიყენება მთავარზე, სიახლეებსა და განცხადებების გვერდზე */
export function AnnouncementCard({ a, index = 0, compact, actions }: { a: Announcement; index?: number; compact?: boolean; actions?: ReactNode }) {
  const accent = a.pinned ? "gold" : a.auto ? "blue" : "red";
  const selected = Boolean(a.id && new URLSearchParams(window.location.search).get("announcement") === a.id);
  const shareUrl = a.id ? `${window.location.origin}/api/announcements?preview=${encodeURIComponent(a.id)}` : window.location.href;
  return (
    <Card
      id={a.id ? `announcement-${a.id}` : undefined}
      className={cn("tone-card lift pass-in group scroll-mt-28", selected && "ring-2 ring-orange-400 ring-offset-2 ring-offset-background")}
      style={{ ...tone(accent), animationDelay: `${index * 90}ms` }}
    >
      {/* ფერადი ზოლი მარცხნივ: მიმაგრებული / კომისარი / ESPN */}
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", ACCENT[accent])} />
      <CardHeader className={cn("relative", compact ? "pb-2 pt-4" : "pb-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            <DateTile a={a} tone={accent} big={!compact} />
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {a.pinned && (
                  <Badge variant="gold" className="gap-1 py-0">
                    <Pin className="h-3 w-3" /> მიმაგრებული
                  </Badge>
                )}
                {isNew(a) && (
                  <Badge className="gap-1.5 border-orange-500/30 bg-orange-500/15 py-0 text-orange-300 hover:bg-orange-500/15">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
                    </span>
                    ახალი
                  </Badge>
                )}
                <span className="flex items-center gap-1">
                  {a.auto ? <Megaphone className="h-3 w-3" /> : <Ball className="h-3 w-3 transition-transform duration-500 group-hover:rotate-[360deg]" />}
                  {a.auto ? "ავტომატური · ESPN" : "კომისარი"}
                </span>
              </div>
              <CardTitle className={cn("leading-snug tracking-tight", compact ? "text-base" : "text-xl")}>{a.title}</CardTitle>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            {a.id && <ShareButton title={a.title} text={a.text ?? ""} url={shareUrl} iconOnly />}
            {actions}
          </div>
        </div>
      </CardHeader>
      {a.text && (
        <CardContent className={cn("relative whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground", compact && "line-clamp-3 text-sm", a.id ? "pb-3" : compact && "pb-4")}>
          {a.text}
        </CardContent>
      )}
      {a.image && (
        <div className={cn("relative px-6", a.id ? "pb-3" : "pb-5")}>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <img
              src={a.image}
              alt={a.title}
              loading="lazy"
              className={cn("w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]", compact ? "max-h-56" : "max-h-[32rem]")}
            />
          </div>
        </div>
      )}
      {a.id && (
        <div className={cn("relative mx-6 border-t border-white/[0.06] pb-4 pt-3", !a.text && "mt-1")}>
          <Reactions id={a.id} initial={a.reactions} />
        </div>
      )}
    </Card>
  );
}
