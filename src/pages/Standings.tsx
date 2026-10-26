import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import type { TableRow } from "@/types";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMyTeam } from "@/lib/myTeam";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";
import Updated from "@/components/league/Updated";

const TABS = [
  ["table", "ცხრილი"],
  ["stats", "სეზონის სტატისტიკა"],
] as const;

const STAT_COLS = ["PTS", "REB", "AST", "STL", "BLK", "3PM", "FGM", "FTM", "OREB", "TO", "DD", "TD"];
/** TO ნაკლები = უკეთესი */
const LOWER_BETTER = new Set(["TO"]);

const pct = (n: number) => (n >= 1 ? "1.000" : n.toFixed(3).replace(/^0/, ""));
const CLINCH: Record<string, string> = { x: "პლეიოფში გავიდა", y: "დივიზიონის გამარჯვებული", z: "პირველი რაუნდი თავისუფალი", e: "გავარდა" };

/** გუნდის სვეტი: გვერდულად სქროლისას ადგილზე რჩება */
function TeamCell({ r, tid, rank }: { r: TableRow; tid?: number; rank?: number }) {
  return (
    <td className="sticky left-0 z-10 bg-card py-2.5 pl-3 pr-3 sm:pl-4">
      <Link to={tid != null ? `/team/${tid}` : "/managers"} className="flex min-w-0 items-center gap-2.5 hover:underline">
        {rank != null && <span className="w-4 shrink-0 text-right text-xs text-muted-foreground tabular">{rank}</span>}
        <TeamAvatar name={r.name} size={28} badge={false} />
        <span className="min-w-0">
          <span className="block max-w-[8.5rem] truncate text-sm font-medium sm:max-w-[14rem]">
            {clean(r.name)}
            {r.clinch && <span className="ml-1 text-[10px] font-semibold text-win">{r.clinch}</span>}
          </span>
          <span className="block text-[10px] text-muted-foreground">{r.abbrev}</span>
        </span>
      </Link>
    </td>
  );
}

function Head({ children, className, onClick, active }: { children: React.ReactNode; className?: string; onClick?: () => void; active?: boolean }) {
  return (
    <th className={cn("whitespace-nowrap px-2.5 py-2.5 text-right text-[11px] font-medium text-muted-foreground", className)}>
      {onClick ? (
        <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-0.5 hover:text-foreground", active && "text-foreground")}>
          {children}
          {active && <ArrowDown className="h-3 w-3" />}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

const TeamHead = () => <th className="sticky left-0 z-10 bg-card py-2.5 pl-3 text-left text-[11px] font-medium text-muted-foreground sm:pl-4">გუნდი</th>;

function StandingsTable({ rows, tidOf, playoffs }: { rows: TableRow[]; tidOf: (n: string) => number | undefined; playoffs: number }) {
  const myTid = useMyTeam();
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-card">
      <table className="w-full min-w-[720px] text-sm tabular">
        <thead className="border-b border-white/[0.08]">
          <tr>
            <TeamHead />
            <Head>W</Head>
            <Head>L</Head>
            <Head>T</Head>
            <Head>PCT</Head>
            <Head>GB</Head>
            <Head className="text-foreground">PF</Head>
            <Head>PA</Head>
            <Head>სერია</Head>
            <Head>აყვანა</Head>
            <Head className="pr-4">ტრეიდი</Head>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.tid} className={cn("border-b border-white/[0.05] last:border-0", i === playoffs - 1 && i < rows.length - 1 && "border-b-2 border-b-white/20", r.tid === myTid && "[&>td]:bg-zinc-900")}>
              <TeamCell r={r} tid={tidOf(r.name)} rank={r.seed || i + 1} />
              <td className="px-2.5 text-right font-medium">{r.w}</td>
              <td className="px-2.5 text-right">{r.l}</td>
              <td className="px-2.5 text-right text-muted-foreground">{r.t}</td>
              <td className="px-2.5 text-right">{pct(r.pct)}</td>
              <td className="px-2.5 text-right text-muted-foreground">{r.gb ? r.gb : "-"}</td>
              <td className="px-2.5 text-right font-semibold">{fmt(Math.round(r.pf))}</td>
              <td className="px-2.5 text-right text-muted-foreground">{fmt(Math.round(r.pa))}</td>
              <td className={cn("px-2.5 text-right", r.streak.startsWith("W") ? "text-win" : r.streak.startsWith("L") ? "text-loss" : "text-muted-foreground")}>{r.streak}</td>
              <td className="px-2.5 text-right text-muted-foreground">{r.acq}</td>
              <td className="px-2.5 pr-4 text-right text-muted-foreground">{r.trades}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatsTable({ rows, tidOf }: { rows: TableRow[]; tidOf: (n: string) => number | undefined }) {
  const [sort, setSort] = useState("PTS");
  const val = (r: TableRow, k: string) => r.stats?.[k] ?? 0;
  const sorted = [...rows].sort((a, b) => (LOWER_BETTER.has(sort) ? val(a, sort) - val(b, sort) : val(b, sort) - val(a, sort)));
  const best: Record<string, number> = Object.fromEntries(STAT_COLS.map((k) => [k, (LOWER_BETTER.has(k) ? Math.min : Math.max)(...rows.map((r) => val(r, k)))]));
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-card">
      <table className="w-full min-w-[820px] text-sm tabular">
        <thead className="border-b border-white/[0.08]">
          <tr>
            <TeamHead />
            {STAT_COLS.map((k) => (
              <Head key={k} onClick={() => setSort(k)} active={sort === k} className={k === "TD" ? "pr-4" : ""}>
                {k}
              </Head>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={r.tid} className="border-b border-white/[0.05] last:border-0">
              <TeamCell r={r} tid={tidOf(r.name)} rank={i + 1} />
              {STAT_COLS.map((k) => {
                const v = val(r, k);
                const top = v === best[k] && v > 0;
                return (
                  <td key={k} className={cn("px-2.5 text-right", k === "TD" && "pr-4", sort === k && "bg-white/[0.03]", top ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Standings() {
  const data = useData();
  const { current, managers, settings } = data;
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "stats" ? "stats" : "table";
  const tidOf = (n: string) => managers.find((m) => clean(m.team) === clean(n))?.tid;
  // სერვერმა ESPN-ის ცხრილი თუ ჯერ არ მოგვცა (ძველი ვერსია ან ქეში), ვაწყობთ არსებული მონაცემებიდან
  const fallback: TableRow[] = current.standings.map((t, i) => {
    const m = managers.find((x) => clean(x.team) === clean(t.name));
    const games = t.w + t.l;
    return {
      tid: m?.tid ?? i,
      name: t.name,
      abbrev: m?.abbrev ?? "",
      seed: i + 1,
      w: t.w,
      l: t.l,
      t: 0,
      pct: games ? t.w / games : 0,
      gb: 0,
      pf: t.pf,
      pa: 0,
      streak: "-",
      clinch: "",
      acq: m?.season_acquisitions ?? 0,
      drops: 0,
      trades: m?.season_trades ?? 0,
      moves: 0,
      proj_rank: null,
      stats: {},
    };
  });
  const rows = current.table?.length ? current.table : fallback;
  const hasStats = rows.some((r) => Object.keys(r.stats ?? {}).length > 0);
  const playoffs = settings?.playoff_teams ?? 4;
  const clinches = [...new Set(rows.map((r) => r.clinch).filter(Boolean))];

  return (
    <>
      <PageHeader
        title={`ცხრილი · ${current.label}`}
        description={current.drafted ? `კვირა ${current.week}. ESPN-ის ცხრილი და გუნდების სეზონის სტატისტიკა.` : "სეზონი ჯერ არ დაწყებულა. დრაფტის შემდეგ აქ ცოცხალი ცხრილი იქნება."}
      >
        <Updated at={data.updated_at} />
      </PageHeader>

      <div role="tablist" className="-mt-2 mb-5 flex gap-1 overflow-x-auto border-b border-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams(id === "table" ? {} : { tab: id }, { replace: true })}
            className={cn("relative whitespace-nowrap px-3 py-2.5 text-sm transition-colors", tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {label}
            {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">ცხრილი ჯერ ვერ ჩაიტვირთა ESPN-იდან.</p>
      ) : tab === "table" ? (
        <div className="space-y-3">
          <StandingsTable rows={rows} tidOf={tidOf} playoffs={playoffs} />
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>სქელი ხაზის ზემოთ: პლეიოფის ზონა ({playoffs} გუნდი)</span>
            {clinches.map((c) => (
              <span key={c}>
                {c}: {CLINCH[c]}
              </span>
            ))}
          </p>
        </div>
      ) : !hasStats ? (
        <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-muted-foreground">გუნდების სტატისტიკა ESPN-იდან ჯერ არ მოსულა. რამდენიმე წუთში განახლდება.</p>
      ) : (
        <div className="space-y-3">
          <StatsTable rows={rows} tidOf={tidOf} />
          <p className="text-[11px] text-muted-foreground">მოთამაშეების ნამდვილი სტატისტიკის ჯამი სეზონში. დააჭირე სვეტს დასალაგებლად, საუკეთესო თითო სვეტში თეთრადაა.</p>
        </div>
      )}
    </>
  );
}
