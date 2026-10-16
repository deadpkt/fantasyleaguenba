import type { Weekly } from "../../types";
import { clean, fmt, heatColor } from "../../lib/format";
import { Team } from "../Mono";

const RESULT = { 1: "მოგება", 0: "წაგება", 2: "ფრე" } as const;

/** გუნდები × კვირები: ფერი = ქულა, წერტილი = მოგება / წაგება */
export default function Heatmap({ weekly }: { weekly: Weekly }) {
  const all = weekly.teams.flatMap((t) => t.scores.flatMap((x) => (x ? [x[0]] : [])));
  const lo = Math.min(...all);
  const hi = Math.max(...all);

  return (
    <div className="glass">
      <div className="tbl" style={{ padding: 14 }}>
        <table className="heat">
          <thead>
            <tr>
              <th />
              {weekly.weeks.map((w) => (
                <th key={w} className="num">
                  W{w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekly.teams.map((t) => (
              <tr key={t.name}>
                <td className="nm">
                  <Team name={t.name} />
                </td>
                {t.scores.map((x, i) => (
                  <td key={weekly.weeks[i]}>
                    {x ? (
                      <div
                        className={`hc ${x[1] === 1 ? "w" : x[1] === 0 ? "l" : ""}`}
                        style={{ background: heatColor((x[0] - lo) / Math.max(1, hi - lo)), color: "#fff" }}
                        title={`${clean(t.name)} · კვირა ${weekly.weeks[i]}: ${fmt(x[0])} (${RESULT[x[1]]})`}
                      >
                        {(x[0] / 1000).toFixed(1)}
                      </div>
                    ) : (
                      <div className="hc" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <span>
          <span className="ramp" />
          ნაკლები → მეტი
        </span>
        <span>
          <i style={{ background: "var(--win)" }} />
          მოგება
        </span>
        <span>
          <i style={{ background: "var(--loss)" }} />
          წაგება
        </span>
      </div>
    </div>
  );
}
