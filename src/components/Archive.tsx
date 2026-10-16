import { useEffect, useState } from "react";
import type { Season } from "../types";
import Section from "./Section";
import Awards from "./archive/Awards";
import FinalStandings from "./archive/FinalStandings";
import Heatmap from "./archive/Heatmap";
import PowerList from "./archive/PowerList";
import LuckChart from "./archive/LuckChart";
import DraftReview from "./archive/DraftReview";

const KEY = "wcf-season";

function readSaved(max: number): number {
  try {
    const v = Number(localStorage.getItem(KEY) ?? 0);
    return v >= 0 && v < max ? v : 0;
  } catch {
    return 0;
  }
}

export default function Archive({ seasons }: { seasons: Season[] }) {
  const [idx, setIdx] = useState(() => readSaved(seasons.length));

  useEffect(() => {
    try {
      localStorage.setItem(KEY, String(idx));
    } catch {
      /* private mode — უბრალოდ არ ვიმახსოვრებთ */
    }
  }, [idx]);

  const s = seasons[idx];

  return (
    <Section id="seasons" title="Archive" sub="ყოველი სეზონი: ჯილდოები, კვირები, იღბალი და დრაფტი.">
      {seasons.length === 0 ? (
        <p className="note">ჯერ დასრულებული მატჩები არ არის.</p>
      ) : (
        <>
          <div className="glass tabs" role="tablist">
            {seasons.map((x, i) => (
              <button key={x.label} role="tab" aria-selected={i === idx} onClick={() => setIdx(i)}>
                {x.label}
                {!x.complete && " · live"}
              </button>
            ))}
          </div>

          <Awards season={s} />

          <h3 className="sub">Final standings</h3>
          <FinalStandings rows={s.standings} />

          <h3 className="sub">
            Week by week <small>ქულები ათასებში · წერტილი = მოგება / წაგება</small>
          </h3>
          <Heatmap weekly={s.weekly} />

          <div className="grid2" style={{ marginTop: 6 }}>
            <div>
              <h3 className="sub">Power</h3>
              <PowerList rows={s.power} />
            </div>
            <div>
              <h3 className="sub">Luck index</h3>
              <LuckChart rows={s.luck} />
            </div>
          </div>

          {s.draft && <DraftReview draft={s.draft} />}
        </>
      )}
    </Section>
  );
}
