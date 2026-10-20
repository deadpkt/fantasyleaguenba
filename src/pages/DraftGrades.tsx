import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"];

export default function DraftGrades() {
  const data = useData();
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => {
    const grouped = new Map<string, typeof data.current_draft>();
    for (const pick of data.current_draft ?? []) grouped.set(pick.team, [...(grouped.get(pick.team) ?? []), pick]);
    return [...grouped].map(([team, picks]) => ({ team, picks, total: picks.reduce((n, p) => n + p.projected, 0) }))
      .sort((a, b) => b.total - a.total).map((r, i) => ({ ...r, rank: i + 1, grade: grades[Math.min(i, grades.length - 1)] }));
  }, [data.current_draft]);
  const leagueAvg = rows.reduce((n, r) => n + r.total, 0) / Math.max(rows.length, 1);
  return <><PageHeader title={`Draft Grades · ${data.current.label}`} description="დააჭირე გუნდის პროფილს და ნახე, რატომ მიიღო ეს შეფასება. ქულა ეფუძნება 2026–27 ESPN projections-ს." />
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">{rows.map((r) => {
      const expanded = open === r.team;
      const best = [...r.picks].sort((a, b) => b.projected - a.projected)[0];
      const diff = r.total - leagueAvg;
      return <Card key={r.team} className="tone-card overflow-hidden border-0"><button type="button" className="w-full text-left" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : r.team)}><CardHeader className="pb-2"><div className="flex items-center gap-3"><TeamAvatar name={r.team} size={40} /><div className="min-w-0 flex-1"><CardTitle className="truncate text-base">{clean(r.team)}</CardTitle><div className="text-xs text-muted-foreground">#{r.rank} · {fmt(r.total)} projected</div></div><div className="text-3xl font-black text-gold">{r.grade}</div><ChevronDown className={cn("h-4 w-4 text-muted-foreground", expanded && "rotate-180")} /></div></CardHeader></button><CardContent className="space-y-2">{r.picks.slice(0, 3).map((p) => <div key={p.pid} className="flex items-center gap-2 text-sm"><span className="w-6 text-xs text-muted-foreground">#{p.n}</span><PlayerPhoto pid={p.pid} className="h-7 w-7 rounded-full" /><span className="min-w-0 flex-1 truncate">{p.player}</span><span className="tabular text-muted-foreground">{fmt(p.projected)}</span></div>)}{expanded && <div className="mt-3 space-y-3 border-t border-white/10 pt-3 text-sm"><p><b>{r.grade}</b> შეფასება მიიღო, რადგან projected ჯამით ლიგაში <b>#{r.rank}</b> ადგილზეა.</p><div className="grid grid-cols-2 gap-2 text-center"><div className="rounded-lg bg-white/[0.04] p-2"><div className="font-semibold tabular">{diff >= 0 ? "+" : ""}{fmt(diff)}</div><div className="text-[10px] text-muted-foreground">ლიგის საშუალოსთან</div></div><div className="rounded-lg bg-white/[0.04] p-2"><div className="font-semibold tabular">{fmt(r.total / Math.max(r.picks.length, 1))}</div><div className="text-[10px] text-muted-foreground">საშუალო თითო პიკზე</div></div></div>{best && <p className="text-muted-foreground">ყველაზე ძლიერი არჩევანი: <b className="text-foreground">{best.player}</b> — {fmt(best.projected)} projected ქულა, საერთო #{best.n} პიკი.</p>}<p className="text-xs text-muted-foreground">შეფასება შეიცვლება ESPN projections-ისა და რეალური შედეგების განახლებისას.</p></div>}</CardContent></Card>;
    })}</div>
  </>;
}
