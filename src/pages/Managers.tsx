import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { espnImage } from "@/lib/logos";
import { NBA, nbaLogo } from "@/lib/nba";
import type { Manager, TableRow } from "@/types";
import { achievements } from "@/lib/badges";
import { useMyTeam } from "@/lib/myTeam";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";
import { cn } from "@/lib/utils";

function Photo({ m }: { m: Manager }) {
  const [broken, setBroken] = useState(false);
  if (!m.logo || broken) return <TeamAvatar name={m.team} size={64} badge={false} className="[&>*:first-child]:rounded-2xl" />;
  return <img src={espnImage(m.logo)} alt={clean(m.team)} loading="lazy" onError={() => setBroken(true)} className="h-16 w-16 rounded-2xl border border-white/10 object-cover" />;
}

function ManagerCard({ m, row }: { m: Manager; row?: TableRow }) {
  const data = useData();
  const mine = useMyTeam() === m.tid;
  const earned = achievements(data, m).filter((b) => b.earned);
  const nba = m.fan ? NBA[m.fan] : undefined;
  const c1 = nba?.primary ?? "#71717a";
  const c2 = nba?.secondary ?? "#3f3f46";
  const career = m.rookie
    ? "პირველი სეზონი ლიგაში"
    : [`კარიერა ${m.w}-${m.l}`, m.titles ? `${m.titles} ტიტული` : null, m.best_week ? `საუკეთესო კვირა ${fmt(m.best_week)}` : null].filter(Boolean).join(" · ");

  return (
    <Link to={`/team/${m.tid}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
      <article className={cn("relative h-full overflow-hidden rounded-2xl border bg-card transition-colors group-hover:border-white/20", mine ? "border-white/30" : "border-white/[0.08]")}>
        {/* გუნდის ფერები ზემოთ და NBA ლოგო ფონზე */}
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
        {m.fan && (
          <img
            src={nbaLogo(m.fan)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="pointer-events-none absolute -right-10 -top-8 h-48 w-48 rotate-[-8deg] object-contain opacity-[0.09] transition-opacity duration-300 group-hover:opacity-[0.14]"
          />
        )}

        <div className="relative space-y-5 p-5">
          <div className="flex items-center gap-4">
            <Photo m={m} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-lg font-semibold tracking-tight">{clean(m.team)}</h2>
                {m.titles > 0 && <Crown className="h-4 w-4 shrink-0 text-gold" aria-label={`${m.titles} ტიტული`} />}
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                {nba && <img src={nbaLogo(m.fan!)} alt="" loading="lazy" className="h-4 w-4 shrink-0 rounded-full bg-white object-contain p-[1px]" />}
                <span className="truncate">{nba ? nba.name : m.abbrev}</span>
                {mine && <span className="shrink-0 rounded-full bg-white px-1.5 text-[10px] font-semibold text-black">შენი</span>}
              </div>
            </div>
            {m.ovr != null && (
              <div className="shrink-0 text-right">
                <div className="text-xl font-semibold leading-none tabular">{m.ovr}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">OVR</div>
              </div>
            )}
          </div>

          {/* ეს სეზონი */}
          <dl className="grid grid-cols-3 border-y border-white/[0.06] py-3">
            {(
              [
                ["ადგილი", row?.seed ? `#${row.seed}` : "-"],
                ["W-L", row ? `${row.w}-${row.l}` : "-"],
                ["PF", row ? fmt(Math.round(row.pf)) : "-"],
              ] as const
            ).map(([label, value], i) => (
              <div key={label} className={i > 0 ? "border-l border-white/[0.06] pl-3" : ""}>
                <dt className="text-[10px] text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className="truncate text-xs text-muted-foreground">{career}</p>
              {earned.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {earned.slice(0, 6).map((b) => (
                    <span key={b.id} title={`${b.name}: ${b.desc}`} className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.06] text-xs">
                      {b.icon}
                    </span>
                  ))}
                  {earned.length > 6 && <span className="self-center text-[11px] text-muted-foreground">+{earned.length - 6}</span>}
                </div>
              )}
            </div>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-muted-foreground transition-colors group-hover:border-white/30 group-hover:text-foreground">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Managers() {
  const { managers, current } = useData();
  const rows = current.table ?? [];
  const rowOf = (m: Manager) => rows.find((r) => r.tid === m.tid) ?? rows.find((r) => clean(r.name) === clean(m.team));
  // ცხრილის მიხედვით; სანამ ESPN-ის ცხრილი არ არის, ტიტულებით
  const sorted = [...managers].sort((a, b) => (rowOf(a)?.seed || 99) - (rowOf(b)?.seed || 99) || b.titles - a.titles);
  return (
    <>
      <PageHeader title={`გუნდები · ${current.label}`} description="ლიგის ყველა გუნდი ამ სეზონის ცხრილის მიხედვით. ფონზე იმ NBA გუნდის ლოგოა, რომელსაც მენეჯერი გულშემატკივრობს." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((m) => (
          <ManagerCard key={m.team} m={m} row={rowOf(m)} />
        ))}
      </div>
    </>
  );
}
