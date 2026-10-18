import { Link } from "react-router-dom";
import { Network, Users } from "lucide-react";
import type { LeagueData, Manager } from "@/types";
import { clean, plain } from "@/lib/format";
import { NBA } from "@/lib/nba";
import { LORE } from "@/data/lore";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamAvatar } from "@/components/league/team";

const same = (a: string, b: string) => plain(a).toLowerCase() === plain(b).toLowerCase();

type Rel = { icon: string; label: string; team: string; note: string };

/** გუნდის კავშირები სხვა გუნდებთან: H2H, მეტოქე, ფინალი, NBA ფანობა, ტრეიდები.
 *  part="map" — დიაგრამა, part="list" — ურთიერთობების სია */
export default function Connections({ data, m, part }: { data: LeagueData; m: Manager; part: "map" | "list" }) {
  const others = data.managers.filter((x) => x.tid !== m.tid);
  const { teams, cells } = data.h2h;
  // H2H-ში გუნდი შეიძლება ძველი სახელით იყოს (მაგ. Golden Dynasty = Orlando Magic)
  const idx = (x: Manager) => teams.findIndex((t) => same(t, x.team) || x.seasons.some((s) => same(s.team, t)));
  const me = idx(m);
  const rows = others.map((o) => {
    const j = idx(o);
    return { o, ...(me >= 0 && j >= 0 ? { w: cells[me][j][0], l: cells[me][j][1] } : { w: 0, l: 0 }) };
  });

  // კავშირების სია
  const rels: Rel[] = [];
  const victim = [...rows].filter((r) => r.w > r.l).sort((a, b) => b.w - b.l - (a.w - a.l))[0];
  if (victim) rels.push({ icon: "🎯", label: "საყვარელი მსხვერპლი", team: victim.o.team, note: `H2H ${victim.w}-${victim.l}` });
  const nemesis = [...rows].filter((r) => r.l > r.w).sort((a, b) => b.l - b.w - (a.l - a.w))[0];
  if (nemesis) rels.push({ icon: "😈", label: "ნემეზისი", team: nemesis.o.team, note: `H2H ${nemesis.w}-${nemesis.l}` });
  const rivalText = LORE[m.tid]?.fans.rival ?? "";
  const rival = others.find((o) => rivalText.toLowerCase().includes(plain(o.team).toLowerCase()));
  if (rival)
    rels.push({ icon: "⚔️", label: "მთავარი მეტოქე", team: rival.team, note: rivalText.split(",").slice(1).join(",").trim() || "ძველი დაპირისპირება" });
  for (const c of data.champions) {
    if (same(c.team, m.team) && c.runner) rels.push({ icon: "🏆", label: "ფინალში დაამარცხა", team: c.runner, note: c.season });
    if (c.runner && same(c.runner, m.team)) rels.push({ icon: "🥈", label: "ფინალში წააგო", team: c.team, note: c.season });
  }
  for (const o of others.filter((o) => o.fan && o.fan === m.fan))
    rels.push({ icon: "💙", label: "იგივე NBA გუნდის ფანი", team: o.team, note: NBA[m.fan!]?.name ?? "" });
  const partners = new Map<string, number>();
  for (const t of data.trades?.current ?? [])
    for (const s of t.sides) {
      if (same(s.team, m.team) && s.to) partners.set(s.to, (partners.get(s.to) ?? 0) + 1);
      if (s.to && same(s.to, m.team)) partners.set(s.team, (partners.get(s.team) ?? 0) + 1);
    }
  const partner = [...partners.entries()].sort((a, b) => b[1] - a[1])[0];
  if (partner) rels.push({ icon: "🤝", label: "ტრეიდ-პარტნიორი", team: partner[0], note: `${partner[1]} ტრეიდი` });

  // დიაგრამა: ცენტრში ეს გუნდი, გარშემო დანარჩენები
  const R = 40; // % ცენტრიდან
  const maxGames = Math.max(1, ...rows.map((r) => r.w + r.l));
  const pos = rows.map((r, i) => {
    const a = (i / rows.length) * Math.PI * 2 - Math.PI / 2;
    return { ...r, x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) };
  });
  const tidOf = (name: string) => data.managers.find((x) => same(x.team, name))?.tid;

  if (part === "list") {
    if (!rels.length) return null;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-orange-300" /> ურთიერთობები
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rels.map((r, i) => {
            const tid = tidOf(r.team);
            return (
              <Link
                key={i}
                to={tid ? `/team/${tid}` : "/h2h"}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
              >
                <span className="text-lg">{r.icon}</span>
                <TeamAvatar name={r.team} size={28} badge={false} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{r.label}</div>
                  <div className="truncate text-sm font-medium">{clean(r.team)}</div>
                </div>
                <span className="max-w-[40%] shrink-0 truncate text-right text-xs text-muted-foreground">{r.note}</span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-4 w-4 text-orange-300" /> კავშირები
        </CardTitle>
        <CardDescription>მწვანე ხაზი: მეტჯერ მოუგია. წითელი: მეტჯერ წაუგია. რაც სქელია, მით მეტი მატჩი.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="relative mx-auto aspect-square w-full max-w-[340px]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="50" cy="50" r={R} fill="none" stroke="white" strokeOpacity="0.05" strokeDasharray="1 1.5" />
            {pos.map((p) => {
              const games = p.w + p.l;
              const color = !games ? "rgba(255,255,255,0.12)" : p.w > p.l ? "hsl(var(--win))" : p.w < p.l ? "hsl(var(--loss))" : "rgba(255,255,255,0.4)";
              return (
                <line
                  key={p.o.tid}
                  x1="50"
                  y1="50"
                  x2={p.x}
                  y2={p.y}
                  stroke={color}
                  strokeOpacity={games ? 0.75 : 1}
                  strokeWidth={games ? 0.5 + (games / maxGames) * 1.6 : 0.4}
                  strokeDasharray={games ? undefined : "1 1.5"}
                  className={games ? "conn-line" : undefined}
                />
              );
            })}
          </svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-orange-400/30">
            <TeamAvatar name={m.team} size={64} badge={false} />
          </div>
          {pos.map((p, i) => (
            <Link
              key={p.o.tid}
              to={`/team/${p.o.tid}`}
              title={`${clean(p.o.team)}: ${p.w}-${p.l}`}
              className="conn-node group/n absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${200 + i * 70}ms` }}
            >
              <div className="rounded-full ring-2 ring-black transition-transform duration-200 group-hover/n:scale-125">
                <TeamAvatar name={p.o.team} size={38} badge={false} />
              </div>
              <span
                className={cn(
                  "absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1 font-mono text-[10px] tabular",
                  p.w > p.l ? "text-win" : p.w < p.l ? "text-loss" : "text-muted-foreground",
                )}
              >
                {p.w + p.l ? `${p.w}-${p.l}` : "-"}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
