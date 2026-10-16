import { useState, type CSSProperties } from "react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { espnImage } from "@/lib/logos";
import { NBA, nbaLogo } from "@/lib/nba";
import type { Manager } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";

function Photo({ m }: { m: Manager }) {
  const [broken, setBroken] = useState(false);
  if (!m.logo || broken) return <TeamAvatar name={m.team} size={84} badge={false} className="[&>*:first-child]:rounded-full" />;
  return (
    <img
      src={espnImage(m.logo)}
      alt={clean(m.team)}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-[84px] w-[84px] rounded-full border-2 border-black object-cover"
    />
  );
}

function ManagerCard({ m }: { m: Manager }) {
  const nba = m.fan ? NBA[m.fan] : undefined;
  const c1 = nba?.primary ?? "#3b82f6";
  const c2 = nba?.secondary ?? "#ef4444";
  const style = {
    borderColor: `${c1}55`,
    background: `radial-gradient(130% 90% at 100% 0%, ${c1}38, transparent 60%), linear-gradient(180deg, hsl(var(--card) / 0.92), hsl(var(--card) / 0.86))`,
    "--tone-shadow": c1,
  } as CSSProperties;

  return (
    <Card className="lift relative overflow-hidden" style={style}>
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
      {m.fan && (
        <img
          src={nbaLogo(m.fan)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute -right-8 -top-6 h-44 w-44 rotate-[-8deg] object-contain opacity-[0.12]"
        />
      )}
      <CardContent className="relative space-y-4 p-5">
        <div className="flex items-start justify-between">
          <div className="rounded-full p-[3px]" style={{ background: `conic-gradient(from 210deg, ${c2}, ${c1}, ${c2})` }}>
            <Photo m={m} />
          </div>
          {m.ovr != null ? (
            <div className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-center backdrop-blur">
              <div className="text-xl font-bold leading-none tabular">{m.ovr}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">OVR</div>
            </div>
          ) : (
            <Badge variant="gold">Rookie</Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="truncate text-xl font-semibold tracking-tight">{clean(m.team)}</div>
          {nba && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 py-0.5 pl-0.5 pr-2.5 text-xs text-muted-foreground">
              <img src={nbaLogo(m.fan!)} alt="" loading="lazy" className="h-5 w-5 rounded-full bg-white object-contain p-[1px]" />
              {nba.name} fan
            </div>
          )}
        </div>

        {m.rookie ? (
          <p className="rounded-lg border border-dashed border-white/15 p-3 text-sm text-muted-foreground">პირველი სეზონი ლიგაში. ისტორია ახლა იწერება.</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              [`${m.w}-${m.l}`, "W-L"],
              [fmt(m.ppg), "PPG"],
              [fmt(m.best_week), "Best"],
              [String(m.titles), "Titles"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-md border border-white/10 bg-black/30 px-1 py-2">
                <div className="text-sm font-semibold tabular">{v}</div>
                <div className="text-[10px] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        )}

        {m.seasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {m.seasons.map((s) => (
              <Badge key={s.season} variant={s.champ ? "gold" : "outline"} className="border-white/10 font-normal">
                {s.season} · {clean(s.team)} · {s.rec}
                {s.champ && " · ჩემპიონი"}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Managers() {
  const { managers } = useData();
  const sorted = [...managers].sort((a, b) => b.titles - a.titles || (b.ovr ?? 0) - (a.ovr ?? 0));
  return (
    <>
      <PageHeader title="მენეჯერები" description="ფოტო — ის, რაც ESPN-ზე გუნდს აქვს დაყენებული. ფერები — NBA გუნდი, რომელსაც გულშემატკივრობს." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((m) => (
          <ManagerCard key={m.team} m={m} />
        ))}
      </div>
    </>
  );
}
