import { useMemo, useState } from "react";
import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"];
const gradeTone = (g: string) => (g.startsWith("A") ? "gold" : g.startsWith("B") ? "blue" : "red") as "gold" | "blue" | "red";
const gradeColor = (g: string) => (g.startsWith("A") ? "text-gold" : g.startsWith("B") ? "text-[hsl(var(--blue))]" : "text-orange-400");

/** value: + = მოთამაშე დრაფტის ადგილზე უკეთესია (Steal), − = ადრე აიყვანეს (Reach) */
function Value({ v }: { v: number }) {
  if (Math.abs(v) < 4) return <span className="w-12 text-right text-[11px] text-muted-foreground tabular">≈</span>;
  return (
    <span className={cn("inline-flex w-12 items-center justify-end gap-0.5 text-[11px] font-semibold tabular", v > 0 ? "text-win" : "text-loss")}>
      {v > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {v > 0 ? `+${v}` : v}
    </span>
  );
}

export default function DraftGrades() {
  const data = useData();
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const picks = data.current_draft ?? [];
    // პროგნოზის მიხედვით რეიტინგი ყველა დრაფტირებულ მოთამაშეში
    const byProj = [...picks].sort((a, b) => b.projected - a.projected);
    const projRank = new Map(byProj.map((p, i) => [p.pid, i + 1]));
    const grouped = new Map<string, (typeof picks[number] & { value: number })[]>();
    for (const p of picks) {
      const value = p.projected > 0 ? p.n - (projRank.get(p.pid) ?? p.n) : 0;
      grouped.set(p.team, [...(grouped.get(p.team) ?? []), { ...p, value }]);
    }
    return [...grouped]
      .map(([team, ps]) => ({ team, picks: ps.sort((a, b) => a.n - b.n), total: ps.reduce((n, p) => n + p.projected, 0) }))
      .sort((a, b) => b.total - a.total)
      .map((r, i) => ({ ...r, rank: i + 1, grade: GRADES[Math.min(i, GRADES.length - 1)] }));
  }, [data.current_draft]);
  const leagueAvg = rows.reduce((n, r) => n + r.total, 0) / Math.max(rows.length, 1);

  if (!rows.length) {
    return (
      <>
        <PageHeader title={`Draft Grades · ${data.current.label}`} />
        <p className="text-sm text-muted-foreground">შეფასებები დრაფტის შემდეგ გამოჩნდება.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Draft Grades · ${data.current.label}`}
        description="დააჭირე გუნდს და ნახე მთელი დრაფტი. შეფასება ეფუძნება ESPN-ის სეზონის პროგნოზს. მწვანე ისარი: მოთამაშე თავის პიკზე უკეთესია (Steal), წითელი: ადრე აიყვანეს (Reach)."
      />
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {rows.map((r, idx) => {
          const expanded = open === r.team;
          const diff = r.total - leagueAvg;
          const steal = [...r.picks].sort((a, b) => b.value - a.value)[0];
          const reach = [...r.picks].sort((a, b) => a.value - b.value)[0];
          return (
            <Card
              key={r.team}
              className={cn("tone-card pass-in overflow-hidden transition-shadow duration-500", expanded && "shadow-[0_24px_60px_-28px_rgba(249,115,22,0.55)]")}
              style={{ ...tone(gradeTone(r.grade)), animationDelay: `${idx * 60}ms` }}
            >
              <button
                type="button"
                className="group flex w-full items-center gap-3 p-4 text-left sm:p-5"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : r.team)}
              >
                <TeamAvatar name={r.team} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{clean(r.team)}</div>
                  <div className="text-xs text-muted-foreground tabular">
                    #{r.rank} ლიგაში · {fmt(Math.round(r.total))} ქულა სეზონზე
                  </div>
                </div>
                <div className={cn("text-4xl font-black leading-none tracking-tight transition-transform duration-300 group-hover:scale-110", gradeColor(r.grade))}>{r.grade}</div>
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-500 ease-out", expanded && "rotate-180")} />
              </button>

              {/* პირველი 3 პიკი — ყოველთვის ჩანს */}
              <div className="flex gap-2 px-4 pb-4 sm:px-5">
                {r.picks.slice(0, 3).map((p) => (
                  <div key={p.pid} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/[0.03] p-1.5">
                    <PlayerPhoto pid={p.pid} className="h-8 w-8 shrink-0 rounded-full bg-muted object-cover" />
                    <div className="min-w-0 text-xs">
                      <div className="truncate font-medium">{p.player.split(" ").slice(-1)[0]}</div>
                      <div className="text-muted-foreground">#{p.n}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* რბილად იხსნება */}
              <div className={cn("grid transition-[grid-template-rows,opacity] duration-500 ease-out", expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-4 border-t border-white/10 px-4 py-4 sm:px-5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white/[0.04] p-2">
                        <div className={cn("font-semibold tabular", diff >= 0 ? "text-win" : "text-loss")}>
                          {diff >= 0 ? "+" : ""}
                          {fmt(Math.round(diff))}
                        </div>
                        <div className="text-[10px] text-muted-foreground">ლიგის საშუალოსთან</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.04] p-2">
                        <div className="truncate font-semibold">{steal && steal.value >= 4 ? steal.player.split(" ").slice(-1)[0] : "-"}</div>
                        <div className="text-[10px] text-muted-foreground">საუკეთესო Steal</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.04] p-2">
                        <div className="truncate font-semibold">{reach && reach.value <= -4 ? reach.player.split(" ").slice(-1)[0] : "-"}</div>
                        <div className="text-[10px] text-muted-foreground">ყველაზე დიდი Reach</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {r.picks.map((p, i) => (
                        <div
                          key={p.pid}
                          className={cn("flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm", expanded && "pick-row")}
                          style={{ animationDelay: `${120 + i * 35}ms` }}
                        >
                          <span className="w-12 shrink-0 font-mono text-[10px] text-muted-foreground">
                            R{p.round} · #{p.n}
                          </span>
                          <PlayerPhoto pid={p.pid} className="h-8 w-8 shrink-0 rounded-full bg-muted object-cover" />
                          <span className="min-w-0 flex-1 truncate">{p.player}</span>
                          <span className="text-xs text-muted-foreground tabular">{p.projected > 0 ? fmt(p.projected) : "გუნდში აღარაა"}</span>
                          <Value v={p.value} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">შეფასება იცვლება ESPN-ის პროგნოზის და რეალური შედეგების განახლებისას.</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
