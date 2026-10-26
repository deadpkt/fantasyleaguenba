import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { LiveData, LiveDay, LivePlayer, LiveTeam } from "@/types";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { injuryLabel, isOut } from "@/lib/injury";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

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
/** IR-ზე მყოფი ან ტრავმით OUT ქულას არ მოიტანს, ამიტომ თვლაში არ შედის */
const counts = (p: LivePlayer) => p.slot !== "IR" && !isOut(p.injury);

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

/** ვისაც იმ დღეს თამაში აქვს: ჯერ ვინც ითამაშებს, ბოლოს OUT-ზე მყოფები */
const playing = (t: LiveTeam, sp: number) =>
  roster(t)
    .filter((p) => p.slot !== "IR" && plays(p, sp))
    .sort((a, b) => Number(counts(b)) - Number(counts(a)) || b.per_game - a.per_game);

function Fold({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/** ტაბლოს ხაზი: გუნდი, ვინ თამაშობს (ფოტოები) და რამდენი */
function TeamLine({ t, list: all, lead, color }: { t: LiveTeam; list: LivePlayer[]; lead: boolean; color: string }) {
  const list = all.filter(counts);
  const out = all.length - list.length;
  return (
    <div className="flex items-center gap-3">
      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: `hsl(var(${color}))`, opacity: lead ? 1 : 0.35 }} />
      <TeamAvatar name={t.name} size={34} badge={false} />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm font-semibold", !lead && "text-muted-foreground")}>{clean(t.name)}</div>
        <div className="mt-0.5 flex h-5 items-center">
          {list.slice(0, 6).map((p, i) => (
            <span key={p.pid} className={cn("h-5 w-5 shrink-0 overflow-hidden rounded-full border border-[hsl(var(--card))] bg-muted", i > 0 && "-ml-1.5")}>
              <PlayerPhoto pid={p.pid} className="h-full w-full" />
            </span>
          ))}
          {list.length > 6 && <span className="ml-1 text-[10px] text-muted-foreground">+{list.length - 6}</span>}
          {list.length === 0 && <span className="text-[11px] text-muted-foreground">არავინ თამაშობს</span>}
          {out > 0 && <span className="ml-2 text-[10px] font-semibold text-loss">{out} OUT</span>}
        </div>
      </div>
      <span className={cn("shrink-0 text-2xl font-semibold tabular", !lead && "text-muted-foreground")}>{list.length}</span>
    </div>
  );
}

function PlayerLine({ p, sp }: { p: LivePlayer; sp: number }) {
  const [opp, tip] = plays(p, sp)!;
  return (
    <Link to={`/player/${p.pid}`} className={cn("flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/[0.04]", !counts(p) && "opacity-50")}>
      <PlayerPhoto pid={p.pid} className="h-8 w-8 shrink-0 rounded-full bg-muted" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{p.name}</span>
        <span className="block text-[11px] text-muted-foreground">
          {p.pro} vs {opp}
          {p.injury && <span className="ml-1.5 font-semibold text-loss">{injuryLabel(p.injury)}</span>}
        </span>
      </span>
      {tip && <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] tabular">{tbilisi(tip)}</span>}
    </Link>
  );
}

function MatchRow({ away, home, sp }: { away: LiveTeam; home: LiveTeam; sp: number }) {
  const a = playing(away, sp);
  const h = playing(home, sp);
  const diff = a.filter(counts).length - h.filter(counts).length;
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-card">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="block w-full space-y-2.5 p-4 text-left">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{diff === 0 ? "თანაბრად თამაშობენ" : `${clean((diff > 0 ? away : home).name)}: +${Math.abs(diff)} მოთამაშე`}</span>
          <span className="flex items-center gap-1">
            {open ? "დაკეცვა" : "სია"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} />
          </span>
        </div>
        <TeamLine t={away} list={a} lead={diff >= 0} color="--red" />
        <TeamLine t={home} list={h} lead={diff <= 0} color="--blue" />
      </button>
      <Fold open={open}>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 border-t border-white/[0.06] p-3 sm:grid-cols-2">
          {[
            [away, a],
            [home, h],
          ].map(([t, list]) => (
            <div key={(t as LiveTeam).name}>
              <div className="px-1.5 pb-1 text-[11px] text-muted-foreground">{clean((t as LiveTeam).name)}</div>
              {(list as LivePlayer[]).length === 0 ? (
                <p className="px-1.5 text-xs text-muted-foreground">არავინ</p>
              ) : (
                (list as LivePlayer[]).map((p) => <PlayerLine key={p.pid} p={p} sp={sp} />)
              )}
            </div>
          ))}
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
  const total = (x: number) => data.matchups.reduce((n, m) => n + playing(m.away, x).filter(counts).length + playing(m.home, x).filter(counts).length, 0);

  return (
    <section className="mb-5 space-y-3">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-2 text-left text-sm font-semibold">
        <CalendarDays className="h-4 w-4 text-muted-foreground" /> ვინ თამაშობს
        <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
          {open ? "დაკეცვა" : "გახსნა"}
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", open && "rotate-180")} />
        </span>
      </button>
      <Fold open={open}>
        <div className="space-y-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {days.map((d) => {
              const on = sp === d.sp;
              return (
                <button
                  key={d.sp}
                  type="button"
                  onClick={() => setSp(d.sp)}
                  className={cn(
                    "flex w-[4.5rem] shrink-0 flex-col items-center rounded-xl border py-2 transition-colors",
                    on ? "border-white bg-white text-black" : "border-white/[0.08] bg-card hover:border-white/20",
                  )}
                >
                  <span className={cn("text-[11px]", on ? "font-semibold" : "text-muted-foreground")}>{dayName(days, d).split(" ")[0]}</span>
                  <span className="text-lg font-semibold leading-tight tabular">{dayOf(d)?.getUTCDate() ?? ""}</span>
                  <span className={cn("text-[10px] tabular", on ? "text-black/60" : "text-muted-foreground")}>{total(d.sp)} მოთ.</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.matchups.map((m, i) => (
              <MatchRow key={`${i}-${sp}`} away={m.away} home={m.home} sp={sp} />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">დრო თბილისით. IR-ზე მყოფი და ტრავმით OUT მოთამაშეები არ ითვლება.</p>
        </div>
      </Fold>
    </section>
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
