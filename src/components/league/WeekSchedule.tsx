import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import type { LiveData, LiveDay, LivePlayer, LiveTeam } from "@/types";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

const WEEKDAY = ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
const MONTH = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

const dayOf = (d: LiveDay) => (d.date ? new Date(`${d.date}T12:00:00Z`) : null);
export const weekday = (d: LiveDay) => {
  const x = dayOf(d);
  return x ? WEEKDAY[x.getUTCDay()] : `დღე ${d.sp}`;
};
const dateLabel = (d: LiveDay) => {
  const x = dayOf(d);
  return x ? `${x.getUTCDate()} ${MONTH[x.getUTCMonth()]}` : "";
};
const tbilisi = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tbilisi" });

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

function DayPicker({ days, value, onChange, count }: { days: LiveDay[]; value: number; onChange: (sp: number) => void; count?: (sp: number) => number }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((d) => (
        <button
          key={d.sp}
          type="button"
          onClick={() => onChange(d.sp)}
          className={cn(
            "flex min-w-[58px] shrink-0 flex-col items-center rounded-lg border px-2 py-1.5 transition-colors",
            value === d.sp ? "border-white bg-white text-black" : "border-white/10 hover:border-white/30",
            d.past && value !== d.sp && "opacity-45",
          )}
        >
          <span className="text-[11px] font-medium">{d.today ? "დღეს" : weekday(d)}</span>
          <span className={cn("text-[10px]", value === d.sp ? "text-black/60" : "text-muted-foreground")}>{dateLabel(d)}</span>
          {count && <span className="mt-0.5 text-xs font-semibold tabular">{count(d.sp)}</span>}
        </button>
      ))}
    </div>
  );
}

function Who({ t, sp, align }: { t: LiveTeam; sp: number; align: "left" | "right" }) {
  const list = roster(t)
    .filter((p) => plays(p, sp))
    .sort((a, b) => Number(counts(b)) - Number(counts(a)) || b.per_game - a.per_game);
  return (
    <div className={cn("min-w-0 space-y-1.5", align === "right" && "sm:text-right")}>
      <div className={cn("flex items-center gap-2", align === "right" && "sm:flex-row-reverse")}>
        <TeamAvatar name={t.name} size={22} badge={false} />
        <span className="truncate text-sm font-medium">{clean(t.name)}</span>
        <span className="ml-auto shrink-0 text-sm font-semibold tabular sm:ml-0">{list.filter(counts).length}</span>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground">არავინ თამაშობს</p>
      ) : (
        <div className={cn("flex flex-wrap gap-1", align === "right" && "sm:justify-end")}>
          {list.map((p) => {
            const [opp, tip] = plays(p, sp)!;
            return (
              <Link
                key={p.pid}
                to={`/player/${p.pid}`}
                title={`${p.name} vs ${opp ?? ""}${tip ? `, ${tbilisi(tip)}` : ""}`}
                className={cn("flex items-center gap-1.5 rounded-full border border-white/10 py-0.5 pl-0.5 pr-2 text-[11px] transition-colors hover:border-white/30", !counts(p) && "opacity-40")}
              >
                <PlayerPhoto pid={p.pid} className="h-5 w-5 rounded-full bg-muted" />
                <span className="font-medium">{p.name.split(" ").slice(-1)[0]}</span>
                <span className="text-muted-foreground">{opp}</span>
                {tip && <span className="text-muted-foreground/70">{tbilisi(tip)}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** ლაივის გვერდზე: აირჩიე კვირის დღე და ნახე, ვინ თამაშობს თითო მატჩაფში */
export function WeekPlanner({ data }: { data: LiveData }) {
  const days = data.days ?? [];
  const [sp, setSp] = useState(() => defaultDay(days));
  if (!days.length || sp == null || !data.drafted) return null;
  const day = days.find((d) => d.sp === sp)!;
  const total = (x: number) => data.matchups.reduce((n, m) => n + [...roster(m.home), ...roster(m.away)].filter((p) => counts(p) && plays(p, x)).length, 0);

  return (
    <Card className="mb-5">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" /> ვინ თამაშობს
            </div>
            <p className="text-xs text-muted-foreground">
              {day.today ? "დღეს" : `${weekday(day)}, ${dateLabel(day)}`}. ციფრი: რამდენი მოთამაშე თამაშობს (IR-ის გარეშე).
            </p>
          </div>
        </div>
        <DayPicker days={days} value={sp} onChange={setSp} count={total} />
        <div className="divide-y divide-white/[0.06]">
          {data.matchups.map((m, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              <Who t={m.away} sp={sp} align="left" />
              <span className="hidden pt-1 text-[10px] text-muted-foreground sm:block">vs</span>
              <Who t={m.home} sp={sp} align="right" />
            </div>
          ))}
        </div>
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
        <div className="grid items-end gap-0.5 pb-1 text-muted-foreground" style={{ gridTemplateColumns: cols }}>
          <span />
          {days.map((d) => (
            <span key={d.sp} className={cn("text-center leading-tight", d.today && "font-semibold text-foreground")}>
              {d.today ? "დღეს" : weekday(d)}
              <br />
              <span className="text-[9px]">{dayOf(d)?.getUTCDate()}</span>
            </span>
          ))}
        </div>
        {list.map((p) => (
          <div key={p.pid} className={cn("grid items-center gap-0.5 border-t border-white/[0.05] py-1", !counts(p) && "opacity-40")} style={{ gridTemplateColumns: cols }}>
            <span className="flex min-w-0 items-center gap-1.5 pr-2">
              <span className="w-6 shrink-0 font-mono text-[9px] text-muted-foreground">{p.slot}</span>
              <span className="truncate">{p.name.split(" ").slice(-1)[0]}</span>
            </span>
            {days.map((d) => {
              const g = plays(p, d.sp);
              return (
                <span
                  key={d.sp}
                  title={g ? `vs ${g[0]}${g[1] ? `, ${tbilisi(g[1])}` : ""}` : ""}
                  className={cn(
                    "rounded py-1 text-center text-[10px]",
                    g ? (d.past ? "bg-white/[0.04] text-muted-foreground" : "bg-white/[0.1] font-medium") : "text-white/15",
                    g && d.today && "ring-1 ring-white/40",
                  )}
                >
                  {g ? g[0] : "·"}
                </span>
              );
            })}
          </div>
        ))}
        <div className="grid gap-0.5 border-t border-white/10 pt-1.5 text-muted-foreground" style={{ gridTemplateColumns: cols }}>
          <span>სულ თამაშობს</span>
          {days.map((d) => (
            <span key={d.sp} className={cn("text-center font-semibold tabular", !d.past && "text-foreground")}>
              {list.filter((p) => counts(p) && plays(p, d.sp)).length}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
