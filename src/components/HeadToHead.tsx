import type { LeagueData } from "../types";
import { clean } from "../lib/format";
import { Mono, Team } from "./Mono";
import Section from "./Section";

export default function HeadToHead({ h2h }: { h2h: LeagueData["h2h"] }) {
  const { teams, cells } = h2h;
  // მხოლოდ გუნდები, რომლებსაც ერთი მატჩი მაინც აქვთ
  const keep = teams.map((_, i) => i).filter((i) => cells[i].some(([w, l]) => w + l > 0));

  return (
    <Section id="h2h" title="Head to Head" sub="მოგება–წაგება სტრიქონის გუნდის მხრიდან. მწვანე — ფლობს, წითელი — ფლობენ.">
      <div className="glass tbl pad">
        <table className="h2h">
          <thead>
            <tr>
              <th />
              {keep.map((j) => (
                <th key={j} className="colh" title={clean(teams[j])}>
                  <Mono name={teams[j]} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keep.map((i) => (
              <tr key={i}>
                <th className="rowh">
                  <Team name={teams[i]} />
                </th>
                {keep.map((j) => {
                  if (i === j)
                    return (
                      <td key={j} className="self">
                        <div />
                      </td>
                    );
                  const [w, l] = cells[i][j];
                  if (!w && !l)
                    return (
                      <td key={j}>
                        <div>–</div>
                      </td>
                    );
                  return (
                    <td key={j} className={w > l ? "pos" : w < l ? "neg" : "eq"} title={`${clean(teams[i])} vs ${clean(teams[j])}`}>
                      <div>
                        {w}-{l}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
