import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { key } from "@/lib/season";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import Updated from "@/components/league/Updated";
import { ownedPlayers } from "@/components/league/ThisSeason";

type Cat = { id: string; label: string; short?: string; get: (p: ReturnType<typeof ownedPlayers>[number]) => number; digits?: number };

const CATS: Cat[] = [
  { id: "total", label: "ფანტაზი ქულა", short: "ქულა", get: (p) => p.total ?? 0 },
  { id: "avg", label: "ქულა თამაშზე", short: "თამაშზე", get: (p) => (p.gp ? p.avg : 0), digits: 1 },
  { id: "PTS", label: "PTS", get: (p) => p.season_line?.PTS ?? 0, digits: 1 },
  { id: "REB", label: "REB", get: (p) => p.season_line?.REB ?? 0, digits: 1 },
  { id: "AST", label: "AST", get: (p) => p.season_line?.AST ?? 0, digits: 1 },
  { id: "STL", label: "STL", get: (p) => p.season_line?.STL ?? 0, digits: 1 },
  { id: "BLK", label: "BLK", get: (p) => p.season_line?.BLK ?? 0, digits: 1 },
  { id: "3PM", label: "3PM", get: (p) => p.season_line?.["3PM"] ?? 0, digits: 1 },
];

const show = (v: number, d = 0) => (d ? v.toFixed(d) : fmt(Math.round(v)));

function Leaders() {
  const data = useData();
  const [cat, setCat] = useState(CATS[0]);
  const [owner, setOwner] = useState<string>("all");
  const rows = useMemo(
    () =>
      ownedPlayers(data)
        .filter((p) => (p.gp ?? 0) > 0 && (owner === "all" || key(p.owner) === key(owner)))
        .sort((a, b) => cat.get(b) - cat.get(a))
        .slice(0, 25),
    [data, cat, owner],
  );
  const max = Math.max(1, ...rows.map((p) => cat.get(p)));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">მოთამაშეები</h2>
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm"
          aria-label="გუნდი"
        >
          <option value="all">ყველა გუნდი</option>
          {data.managers.map((m) => (
            <option key={m.tid} value={m.team}>
              {clean(m.team)}
            </option>
          ))}
        </select>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-colors",
                cat.id === c.id ? "bg-white text-black" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">სტატისტიკა პირველი თამაშების შემდეგ გამოჩნდება.</p>
      ) : (
        <Card>
          <CardContent className="divide-y divide-white/5 p-2 sm:p-3">
            {rows.map((p, i) => {
              const v = cat.get(p);
              const line = p.season_line;
              return (
                <div key={p.pid} className="flex items-center gap-3 px-1 py-2">
                  <span className={cn("w-6 text-center font-mono text-sm", i < 3 ? "text-gold" : "text-muted-foreground")}>{i + 1}</span>
                  <PlayerPhoto pid={p.pid} className="h-10 w-10 shrink-0 rounded-full bg-muted object-cover" />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/player/${p.pid}`} className="truncate text-sm font-medium hover:underline">
                        {p.name}
                      </Link>
                      {p.injury && (
                        <Badge variant="loss" className="px-1 py-0 text-[9px]">
                          {p.injury.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      <span>
                        {p.pos} · {p.pro} · {p.gp} თამ.
                      </span>
                      {line && (
                        <span className="tabular">
                          {line.PTS} PTS · {line.REB} REB · {line.AST} AST
                          {line.STL ? ` · ${line.STL} STL` : ""}
                          {line.BLK ? ` · ${line.BLK} BLK` : ""}
                          {line["3PM"] ? ` · ${line["3PM"]} 3PM` : ""}
                        </span>
                      )}
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="bar-fill h-full origin-left rounded-full bg-gradient-to-r from-orange-500 to-amber-300" style={{ width: `${(v / max) * 100}%` }} />
                    </div>
                  </div>
                  <Link to={`/team/${data.managers.find((m) => key(m.team) === key(p.owner))?.tid ?? ""}`} title={clean(p.owner)} className="hidden shrink-0 sm:block">
                    <TeamAvatar name={p.owner} size={24} badge={false} />
                  </Link>
                  <div className="w-16 shrink-0 text-right">
                    <div className="text-base font-bold tabular">{show(v, cat.digits)}</div>
                    <div className="text-[10px] text-muted-foreground">{cat.short ?? cat.label}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function Teams() {
  const data = useData();
  const rows = data.managers
    .map((m) => {
      const played = m.roster.filter((p) => (p.gp ?? 0) > 0);
      const total = m.roster.reduce((n, p) => n + (p.total ?? 0), 0);
      const games = played.reduce((n, p) => n + (p.gp ?? 0), 0);
      const st = data.current.standings.find((s) => key(s.name) === key(m.team));
      const pj = Object.entries(data.projections?.teams ?? {}).find(([n]) => key(n) === key(m.team))?.[1];
      const best = [...m.roster].sort((a, b) => (b.total ?? 0) - (a.total ?? 0))[0];
      return { m, total, games, avg: games ? total / games : 0, st, pj, best, injured: m.roster.filter((p) => p.injury).length };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">გუნდები</h2>
      <Card>
        <CardContent className="overflow-x-auto p-2 sm:p-3">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-2 font-normal">გუნდი</th>
                <th className="px-2 py-2 text-right font-normal">W-L</th>
                <th className="px-2 py-2 text-right font-normal">სეზონის ქულა</th>
                <th className="px-2 py-2 text-right font-normal">თამაშზე</th>
                <th className="px-2 py-2 text-right font-normal">ეს კვირა</th>
                <th className="px-2 py-2 text-right font-normal">დარჩა</th>
                <th className="px-2 py-2 font-normal">საუკეთესო</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.m.tid} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-2 py-2">
                    <Link to={`/team/${r.m.tid}`} className="flex items-center gap-2">
                      <TeamAvatar name={r.m.team} size={24} badge={false} />
                      <span className="truncate font-medium">{clean(r.m.team)}</span>
                      {r.injured > 0 && <span className="text-[10px] text-loss">🩹{r.injured}</span>}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-right tabular">{r.st ? `${r.st.w}-${r.st.l}` : "-"}</td>
                  <td className="px-2 py-2 text-right font-semibold tabular">{fmt(Math.round(r.total))}</td>
                  <td className="px-2 py-2 text-right tabular text-muted-foreground">{r.avg ? r.avg.toFixed(1) : "-"}</td>
                  <td className="px-2 py-2 text-right tabular">{r.pj ? fmt(Math.round(r.pj.so_far)) : "-"}</td>
                  <td className="px-2 py-2 text-right tabular text-muted-foreground">{r.pj ? r.pj.games_left : "-"}</td>
                  <td className="px-2 py-2">
                    {r.best && (r.best.total ?? 0) > 0 && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <PlayerPhoto pid={r.best.pid} className="h-6 w-6 rounded-full bg-muted object-cover" />
                        <span className="truncate">{r.best.name.split(" ").slice(-1)[0]}</span>
                        <span className="text-muted-foreground tabular">{fmt(r.best.total ?? 0)}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}

export default function Stats() {
  const data = useData();
  return (
    <>
      <PageHeader title={`სტატისტიკა · ${data.current.label}`} description="ამ სეზონის მოთამაშეები და გუნდები. ქულები ESPN-იდან ავტომატურად ახლდება.">
        <Updated at={data.updated_at} />
      </PageHeader>
      <div className="space-y-10">
        <Leaders />
        <Teams />
      </div>
    </>
  );
}
