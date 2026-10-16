import type { PowerRow } from "../../types";
import { clean } from "../../lib/format";

export default function PowerList({ rows }: { rows: PowerRow[] }) {
  const max = Math.max(...rows.map((p) => p.score));
  return (
    <div className="glass pad">
      <div className="pw">
        {rows.map((p, i) => (
          <div className={`pw-row${i < 3 ? " top" : ""}`} key={p.name}>
            <div className="rk">{i + 1}</div>
            <div className="bar">
              <i style={{ width: `${((p.score / max) * 100).toFixed(1)}%` }} />
              <span>
                {clean(p.name)} · {p.rec}
              </span>
            </div>
            <div className="sc">{p.score.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
