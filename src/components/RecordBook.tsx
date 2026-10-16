import type { RecordItem } from "../types";
import { clean } from "../lib/format";
import Section from "./Section";

export default function RecordBook({ records }: { records: RecordItem[] }) {
  return (
    <Section id="records" title="Record Book" sub="ლიგის ისტორიის რიცხვები, რომლებიც ჯერ არავის გაუტეხია.">
      <div className="recs">
        {records.map((r) => (
          <div className="glass rec" key={r.k}>
            <div className="k">{r.k}</div>
            <div className="v num">{r.v}</div>
            <div className="who">{clean(r.who)}</div>
            <div className="when">{r.when}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
