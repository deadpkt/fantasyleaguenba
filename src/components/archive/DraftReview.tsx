import type { DraftPick, DraftReview as Review } from "../../types";
import { clean, fmt } from "../../lib/format";
import { Mono, Team } from "../Mono";
import PlayerPhoto from "../PlayerPhoto";

function PickCard({ x, up }: { x: DraftPick; up: boolean }) {
  return (
    <div className="glass dl">
      <div className="player">
        <PlayerPhoto pid={x.pid} size={52} />
        <div>
          <b>{x.player}</b>
          <div className="meta">
            {clean(x.team)} · {fmt(x.total)} FP
          </div>
        </div>
      </div>
      <div className={`mv ${up ? "up" : "down"}`}>
        #{x.n} → #{x.rank}
      </div>
    </div>
  );
}

export default function DraftReview({ draft }: { draft: Review }) {
  return (
    <>
      <h3 className="sub">
        Draft review <small>პიკი → სეზონის ბოლოს ადგილი ფანტაზი-ქულებით</small>
      </h3>
      <div className="grid2">
        <div>
          <div className="colhead">Steals</div>
          <div className="dlist">
            {draft.steals.map((x) => (
              <PickCard key={x.n} x={x} up />
            ))}
          </div>
        </div>
        <div>
          <div className="colhead">Busts</div>
          <div className="dlist">
            {draft.busts.map((x) => (
              <PickCard key={x.n} x={x} up={false} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 18 }}>
        <div>
          <div className="colhead">Round 1</div>
          <div className="glass tbl">
            <table>
              <thead>
                <tr>
                  <th>Pick</th>
                  <th>Player</th>
                  <th>Team</th>
                  <th className="r">FP</th>
                  <th className="r">Rank</th>
                </tr>
              </thead>
              <tbody>
                {draft.round1.map((x) => (
                  <tr key={x.n}>
                    <td className="rk" style={{ fontSize: 20 }}>
                      {x.n}
                    </td>
                    <td>
                      <div className="player">
                        <PlayerPhoto pid={x.pid} size={40} />
                        <b>{x.player}</b>
                      </div>
                    </td>
                    <td>
                      <Team name={x.team} />
                    </td>
                    <td className="r num">{fmt(x.total)}</td>
                    <td className="r">
                      <span className={`mv ${x.rank <= x.n + 4 ? "up" : "down"}`}>#{x.rank}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="colhead">Draft grades · შედეგის მიხედვით</div>
          <div className="dlist">
            {draft.grades.map((g) => (
              <div className="glass dl" key={g.team}>
                <div className="team">
                  <Mono name={g.team} />
                  <div>
                    <b>{clean(g.team)}</b>
                    <div className="meta">საუკეთესო: {g.best}</div>
                  </div>
                </div>
                <div className="grade">{g.grade}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
