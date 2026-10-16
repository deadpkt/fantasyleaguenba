import type { CurrentSeason } from "../types";
import { fmt } from "../lib/format";
import { Team } from "./Mono";
import Section from "./Section";

export default function CurrentStandings({ current }: { current: CurrentSeason }) {
  const sub = current.drafted
    ? `კვირა ${current.week} · ცხრილი ESPN-იდან`
    : "სეზონი ჯერ არ დაწყებულა. დრაფტის შემდეგ აქ ცოცხალი ცხრილი იქნება.";

  return (
    <Section id="now" title={current.label} sub={sub}>
      <div className="glass tbl">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>გუნდი</th>
              <th className="r">W-L</th>
              <th className="r">PF</th>
            </tr>
          </thead>
          <tbody>
            {current.standings.map((t, i) => (
              <tr key={t.name} className={i === 0 && current.drafted ? "first" : undefined}>
                <td className="rk">{current.drafted ? i + 1 : "–"}</td>
                <td>
                  <Team name={t.name} />
                </td>
                <td className="r num">
                  {t.w}-{t.l}
                </td>
                <td className="r num">{fmt(t.pf)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
