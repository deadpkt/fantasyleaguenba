import type { Champion } from "../types";
import { clean } from "../lib/format";
import Section from "./Section";

/** ჩემპიონების ბანერები არენის ჭერზე + ცარიელი ადგილი მიმდინარე სეზონისთვის */
export default function Rafters({
  league,
  champions,
  nextSeason,
}: {
  league: string;
  champions: Champion[];
  nextSeason: string;
}) {
  return (
    <Section id="champions" title="The Rafters" sub="ყოველი ჩემპიონი არენის ჭერზე იკიდება. შემდეგი ადგილი თავისუფალია.">
      <div className="glass rafters">
        {champions.map((c) => (
          <div className="banner" key={c.season}>
            <div className="t1">{clean(league)}</div>
            <div className="t2">CHAMPIONS</div>
            <div className="t3">{c.season}</div>
            <div className="t4">{clean(c.team)}</div>
            <div className="t5">{c.rec}</div>
          </div>
        ))}
        <div className="banner empty">
          <div className="t2">?</div>
          <div className="t1">{nextSeason}</div>
          <div className="ka" style={{ fontSize: 12 }}>
            ადგილი თავისუფალია
          </div>
        </div>
      </div>
    </Section>
  );
}
