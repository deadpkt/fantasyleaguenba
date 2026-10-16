import type { Season } from "../../types";
import { clean, fmt } from "../../lib/format";

function Award({ t, n, v, hl }: { t: string; n: string; v: string; hl?: boolean }) {
  return (
    <div className={`glass aw${hl ? " hl" : ""}`}>
      <div className="t">{t}</div>
      <div className="n">{n}</div>
      <div className="v">{v}</div>
    </div>
  );
}

export default function Awards({ season }: { season: Season }) {
  const a = season.awards;
  const champ = season.standings.find((t) => t.final === 1);
  return (
    <div className="awards">
      {champ && <Award hl t="Champion" n={clean(champ.name)} v={`${champ.w}-${champ.l} · ${fmt(champ.pf)} PF`} />}
      {a.mvp && <Award t="Season MVP" n={a.mvp.player} v={`${fmt(a.mvp.total)} FP · ${a.mvp.avg}/G`} />}
      {a.best_week && <Award t="Best week" n={clean(a.best_week.team)} v={`${fmt(a.best_week.v)} · კვირა ${a.best_week.p}`} />}
      <Award t="Most points" n={clean(a.pf.team)} v={`${fmt(a.pf.v)} PF`} />
      <Award t="Most points against" n={clean(a.pa.team)} v={`${fmt(a.pa.v)} PA`} />
      <Award t="Waiver king" n={clean(a.acq.team)} v={`${a.acq.v} აყვანა`} />
      {a.trades.v > 0 && <Award t="Trade master" n={clean(a.trades.team)} v={`${a.trades.v} ტრეიდი`} />}
    </div>
  );
}
