import type { SeasonStanding } from "../../types";
import { fmt } from "../../lib/format";
import { Team } from "../Mono";

export default function FinalStandings({ rows }: { rows: SeasonStanding[] }) {
  return (
    <div className="glass tbl">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>გუნდი</th>
            <th className="r">W-L</th>
            <th className="r">PF</th>
            <th className="r">PA</th>
            <th className="r">Seed</th>
            <th className="r">Adds</th>
            <th className="r">Trades</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={t.name} className={t.final === 1 ? "first" : undefined}>
              <td className="rk">{t.final || i + 1}</td>
              <td>
                <Team name={t.name}>
                  {t.final === 1 && <span className="chip gold">Champ</span>}
                  {t.final === 2 && <span className="chip blue">Finals</span>}
                </Team>
              </td>
              <td className="r num">
                {t.w}-{t.l}
              </td>
              <td className="r num">{fmt(t.pf)}</td>
              <td className="r num">{fmt(t.pa)}</td>
              <td className="r num">{t.seed}</td>
              <td className="r num">{t.acq}</td>
              <td className="r num">{t.trades}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
