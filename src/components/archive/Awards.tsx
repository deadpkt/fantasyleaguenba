import type { ReactNode } from "react";
import type { Season } from "../../types";
import { clean, fmt } from "../../lib/format";
import { Mono } from "../Mono";
import PlayerPhoto from "../PlayerPhoto";

function Award({ t, n, v, hl, icon }: { t: string; n: string; v: string; hl?: boolean; icon?: ReactNode }) {
  return (
    <div className={`glass aw${hl ? " hl" : ""}`}>
      <div className="aw-top">
        <div className="t">{t}</div>
        {icon}
      </div>
      <div className="n">{n}</div>
      <div className="v">{v}</div>
    </div>
  );
}

export default function Awards({ season }: { season: Season }) {
  const a = season.awards;
  const champ = season.standings.find((t) => t.final === 1);
  const logo = (name: string) => <Mono name={name} size={34} />;
  return (
    <div className="awards">
      {champ && (
        <Award hl t="Champion" n={clean(champ.name)} v={`${champ.w}-${champ.l} · ${fmt(champ.pf)} PF`} icon={<Mono name={champ.name} size={56} />} />
      )}
      {a.mvp && (
        <Award
          t="Season MVP"
          n={a.mvp.player}
          v={`${fmt(a.mvp.total)} FP · ${a.mvp.avg}/G`}
          icon={<PlayerPhoto pid={a.mvp.pid} size={60} className="aw-photo" />}
        />
      )}
      {a.best_week && <Award t="Best week" n={clean(a.best_week.team)} v={`${fmt(a.best_week.v)} · კვირა ${a.best_week.p}`} icon={logo(a.best_week.team)} />}
      <Award t="Most points" n={clean(a.pf.team)} v={`${fmt(a.pf.v)} PF`} icon={logo(a.pf.team)} />
      <Award t="Most points against" n={clean(a.pa.team)} v={`${fmt(a.pa.v)} PA`} icon={logo(a.pa.team)} />
      <Award t="Waiver king" n={clean(a.acq.team)} v={`${a.acq.v} აყვანა`} icon={logo(a.acq.team)} />
      {a.trades.v > 0 && <Award t="Trade master" n={clean(a.trades.team)} v={`${a.trades.v} ტრეიდი`} icon={logo(a.trades.team)} />}
    </div>
  );
}
