import { useMemo } from "react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"];

export default function DraftGrades() {
  const data = useData();
  const rows = useMemo(() => {
    const grouped = new Map<string, typeof data.current_draft>();
    for (const pick of data.current_draft ?? []) grouped.set(pick.team, [...(grouped.get(pick.team) ?? []), pick]);
    return [...grouped].map(([team, picks]) => ({ team, picks, total: picks.reduce((n, p) => n + p.projected, 0) }))
      .sort((a, b) => b.total - a.total).map((r, i) => ({ ...r, grade: grades[Math.min(i, grades.length - 1)] }));
  }, [data.current_draft]);
  return <><PageHeader title={`Draft Grades · ${data.current.label}`} description="შეფასება მიმდინარე დრაფტის მოთამაშეთა ESPN projections-ითაა და სეზონის შედეგებთან ერთად განახლდება." />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{rows.map((r, i) => <Card key={r.team} className="tone-card"><CardHeader className="pb-2"><div className="flex items-center gap-3"><TeamAvatar name={r.team} size={40} /><div className="min-w-0 flex-1"><CardTitle className="truncate text-base">{clean(r.team)}</CardTitle><div className="text-xs text-muted-foreground">#{i + 1} · {fmt(r.total)} projected</div></div><div className="text-3xl font-black text-gold">{r.grade}</div></div></CardHeader><CardContent className="space-y-2">{r.picks.slice(0, 3).map((p) => <div key={p.pid} className="flex items-center gap-2 text-sm"><span className="w-6 text-xs text-muted-foreground">#{p.n}</span><PlayerPhoto pid={p.pid} className="h-7 w-7 rounded-full" /><span className="min-w-0 flex-1 truncate">{p.player}</span><span className="tabular text-muted-foreground">{fmt(p.projected)}</span></div>)}</CardContent></Card>)}</div>
  </>;
}
