import type { RecordItem } from "../types";
import { clean } from "../lib/format";
import CountUp from "./CountUp";
import { Mono } from "./Mono";
import Section from "./Section";

export default function RecordBook({ records }: { records: RecordItem[] }) {
  return (
    <Section id="records" title="Record Book" sub="ლიგის ისტორიის რიცხვები, რომლებიც ჯერ არავის გაუტეხია.">
      <div className="recs">
        {records.map((r) => {
          const first = clean(r.who).split(" vs ")[0];
          return (
            <div className="glass rec" key={r.k}>
              <div className="k">{r.k}</div>
              <CountUp className="v num" value={r.v} />
              <div className="who">
                <Mono name={first} size={26} />
                <span>{clean(r.who)}</span>
              </div>
              <div className="when">{r.when}</div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
