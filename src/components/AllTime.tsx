import type { AllTimeRow } from "../types";
import { clean, fmt, pct3 } from "../lib/format";
import { Team } from "./Mono";
import Section from "./Section";

const tier = (ovr: number) => (ovr >= 90 ? "t90" : ovr >= 80 ? "t80" : ovr >= 70 ? "t70" : "");

export default function AllTime({ rows }: { rows: AllTimeRow[] }) {
  const played = rows.filter((a) => a.w + a.l + a.t > 0);

  return (
    <Section id="alltime" title="All-Time" sub="ყველა სეზონი, რეგულარული სეზონის მატჩები. OVR — მენეჯერის რეიტინგი (60–99).">
      <div className="glass tbl">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>მენეჯერი</th>
              <th>OVR</th>
              <th className="r">W-L</th>
              <th className="r">PCT</th>
              <th className="r">PPG</th>
              <th className="r">Best wk</th>
              <th className="r">Playoffs</th>
              <th className="r">Titles</th>
            </tr>
          </thead>
          <tbody>
            {played.map((a, i) => (
              <tr
                key={a.team}
                className={i === 0 ? "first" : undefined}
                title={a.history
                  .map((h) => `${h.season}: ${clean(h.team)} ${h.rec}${h.final === 1 && h.complete ? " (ჩემპიონი)" : ""}`)
                  .join(" · ")}
              >
                <td className="rk">{i + 1}</td>
                <td>
                  <Team name={a.team} />
                </td>
                <td>
                  <span className={`ovr ${tier(a.ovr)}`}>{a.ovr}</span>
                </td>
                <td className="r num">
                  {a.w}-{a.l}
                  {a.t ? `-${a.t}` : ""}
                </td>
                <td className="r num">{pct3(a.pct)}</td>
                <td className="r num">{fmt(a.ppg)}</td>
                <td className="r num">{fmt(a.best_week)}</td>
                <td className="r num">{a.playoffs}</td>
                <td className="r num">{a.titles ? <span className="rings">{"◆".repeat(a.titles)}</span> : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
