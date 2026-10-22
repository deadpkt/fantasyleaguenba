import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { LiveData, LiveDay, LivePlayer, LiveTeam } from "@/types";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const WEEKDAY = ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];

const dayOf = (d: LiveDay) => (d.date ? new Date(`${d.date}T12:00:00Z`) : null);
export const weekday = (d: LiveDay) => {
  const x = dayOf(d);
  return x ? WEEKDAY[x.getUTCDay()] : `დღე ${d.sp}`;
};
const tbilisi = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tbilisi",
  });

const roster = (t: LiveTeam) => [...t.starters, ...t.bench];
const plays = (p: LivePlayer, sp: number) => p.games?.[String(sp)];
/** IR-ზე მყოფი ქულას არ მოიტანს, ამიტომ თვლაში არ შედის */
const counts = (p: LivePlayer) => p.slot !== "IR";

/** რომელი დღე გაიხსნას: ხვალ, თუ კვირა არ მთავრდება, თორემ დღეს */
function defaultDay(days: LiveDay[]) {
  const i = days.findIndex((d) => d.today);
  if (i === -1) return days.find((d) => !d.past)?.sp ?? days[0]?.sp;
  return (days[i + 1] ?? days[i]).sp;
}

/** დღის სახელი ღილაკზე: დღეს, ხვალ, მერე კვირის დღე */
function dayName(days: LiveDay[], d: LiveDay) {
  if (d.today) return "დღეს";
  const t = days.findIndex((x) => x.today);
  if (t !== -1 && days[t + 1]?.sp === d.sp) return "ხვალ";
  return `${weekday(d)} ${dayOf(d)?.getUTCDate() ?? ""}`;
}

/** "Anthony Edwards" → "A. Edwards", რომ ტელეფონზე ერთ ხაზზე დაეტიოს */
const short = (name: string) => {
  const [first, ...rest] = name.split(" ");
  return rest.length ? `${first[0]}. ${rest.join(" ")}` : name;
};

const playing = (t: LiveTeam, sp: number) =>
  roster(t)
    .filter((p) => counts(p) && plays(p, sp))
    .sort((a, b) => b.per_game - a.per_game);

function Names({
  list,
  sp,
  align,
}: {
  list: LivePlayer[];
  sp: number;
  align: "left" | "right";
}) {
  if (!list.length)
    return (
      <p
        className={cn(
          "text-xs text-muted-foreground",
          align === "right" && "text-right",
        )}
      >
        არავინ
      </p>
    );
  return (
    <ul
      className={cn("space-y-1 text-[13px]", align === "right" && "text-right")}
    >
      {list.map((p) => {
        const tip = plays(p, sp)![1];
        return (
          <li key={p.pid} className="truncate whitespace-nowrap">
            <Link
              to={`/player/${p.pid}`}
              title={p.name}
              className="hover:underline"
            >
              {short(p.name)}
            </Link>
            {tip && (
              <span className="ml-1.5 text-[11px] text-muted-foreground tabular">
                {tbilisi(tip)}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Fold({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function MatchRow({
  away,
  home,
  sp,
}: {
  away: LiveTeam;
  home: LiveTeam;
  sp: number;
}) {
  const a = playing(away, sp);
  const h = playing(home, sp);
  const diff = a.length - h.length;
  const ahead = diff > 0 ? away : home;
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.08] p-4">
      <div className="flex items-start justify-between gap-4 text-sm font-medium">
        <span className="min-w-0 break-words">{clean(away.name)}</span>
        <span className="min-w-0 break-words text-right">
          {clean(home.name)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-center gap-3 text-4xl font-semibold tabular">
        <span className={cn(diff < 0 && "text-muted-foreground")}>
          {a.length}
        </span>
        <span className="text-lg text-muted-foreground">:</span>
        <span className={cn(diff > 0 && "text-muted-foreground")}>
          {h.length}
        </span>
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        {diff === 0
          ? "თანაბრად თამაშობენ"
          : `${clean(ahead.name)}-ს ${Math.abs(diff)} მოთამაშით მეტი ჰყავს`}
      </p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
      >
        {open ? "დაკეცვა" : "მოთამაშეები"}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <Fold open={open}>
        <div className="mt-2 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-3">
          <Names list={a} sp={sp} align="left" />
          <Names list={h} sp={sp} align="right" />
        </div>
      </Fold>
    </div>
  );
}

const FOLD_KEY = "wcf-who-plays-open";

/** ლაივის გვერდზე: აირჩიე დღე და ნახე, ვინ თამაშობს თითო მატჩაფში */
export function WeekPlanner({ data }: { data: LiveData }) {
  const days = (data.days ?? []).filter((d) => !d.past);
  const [sp, setSp] = useState(() => defaultDay(days));
  // მთელი სექციის აკეცვა: არჩევანი ამ ბრაუზერში ინახება
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(FOLD_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const toggle = () => {
    setOpen(!open);
    try {
      localStorage.setItem(FOLD_KEY, open ? "0" : "1");
    } catch {
      /* private mode */
    }
  };
  if (!days.length || sp == null || !data.drafted) return null;

  return (
    <Card className="mb-5">
      <CardContent className={cn("p-4 sm:p-5", open && "space-y-4")}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex w-full items-center gap-2 text-left text-base font-semibold"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" /> ვინ
          თამაშობს
          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
            {open ? "დაკეცვა" : "გახსნა"}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                open && "rotate-180",
              )}
            />
          </span>
        </button>
        <Fold open={open}>
          <div className="space-y-4">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {days.map((d) => (
                <button
                  key={d.sp}
                  type="button"
                  onClick={() => setSp(d.sp)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    sp === d.sp
                      ? "bg-white font-medium text-black"
                      : "bg-white/[0.06] text-muted-foreground hover:text-foreground",
                  )}
                >
                  {dayName(days, d)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.matchups.map((m, i) => (
                <MatchRow key={i} away={m.away} home={m.home} sp={sp} />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              დრო თბილისით. IR-ზე მყოფი მოთამაშეები არ ითვლება.
            </p>
          </div>
        </Fold>
      </CardContent>
    </Card>
  );
}

/** მატჩაფის შიგნით: მოთამაშე × კვირის დღეები */
export function TeamCalendar({ t, days }: { t: LiveTeam; days: LiveDay[] }) {
  const list = roster(t);
  if (!list.length || !days.length) return null;
  const cols = `minmax(110px,1fr) repeat(${days.length}, minmax(34px, 44px))`;
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="min-w-max text-[11px]">
        <div
          className="grid items-end gap-0.5 pb-1 text-muted-foreground"
          style={{ gridTemplateColumns: cols }}
        >
          <span />
          {days.map((d) => (
            <span
              key={d.sp}
              className={cn(
                "text-center leading-tight",
                d.today && "font-semibold text-foreground",
              )}
            >
              {d.today ? "დღეს" : weekday(d)}
              <br />
              <span className="text-[9px]">{dayOf(d)?.getUTCDate()}</span>
            </span>
          ))}
        </div>
        {list.map((p) => (
          <div
            key={p.pid}
            className={cn(
              "grid items-center gap-0.5 border-t border-white/[0.05] py-1",
              !counts(p) && "opacity-40",
            )}
            style={{ gridTemplateColumns: cols }}
          >
            <span className="flex min-w-0 items-center gap-1.5 pr-2">
              <span className="w-6 shrink-0 font-mono text-[9px] text-muted-foreground">
                {p.slot}
              </span>
              <span className="truncate">{p.name.split(" ").slice(-1)[0]}</span>
            </span>
            {days.map((d) => {
              const g = plays(p, d.sp);
              return (
                <span
                  key={d.sp}
                  title={
                    g ? `vs ${g[0]}${g[1] ? `, ${tbilisi(g[1])}` : ""}` : ""
                  }
                  className={cn(
                    "rounded py-1 text-center text-[10px]",
                    g
                      ? d.past
                        ? "bg-white/[0.04] text-muted-foreground"
                        : "bg-white/[0.1] font-medium"
                      : "text-white/15",
                    g && d.today && "ring-1 ring-white/40",
                  )}
                >
                  {g ? g[0] : "·"}
                </span>
              );
            })}
          </div>
        ))}
        <div
          className="grid gap-0.5 border-t border-white/10 pt-1.5 text-muted-foreground"
          style={{ gridTemplateColumns: cols }}
        >
          <span>სულ თამაშობს</span>
          {days.map((d) => (
            <span
              key={d.sp}
              className={cn(
                "text-center font-semibold tabular",
                !d.past && "text-foreground",
              )}
            >
              {list.filter((p) => counts(p) && plays(p, d.sp)).length}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
