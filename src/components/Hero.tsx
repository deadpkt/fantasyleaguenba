import type { LeagueData } from "../types";
import { clean, fmt } from "../lib/format";
import CourtCanvas from "./CourtCanvas";

export default function Hero({ data }: { data: LeagueData }) {
  const { current, champions, seasons } = data;
  const champ = champions[champions.length - 1];
  const last = seasons.find((s) => s.complete);
  const champRow = last?.standings.find((t) => t.final === 1);
  const words = clean(data.league).split(" ");
  const head = words.slice(0, -1).join(" ");
  const tail = words[words.length - 1];

  const lede = current.drafted
    ? `კვირა ${current.week}. ${current.standings.length} გუნდი, ერთი ბანერი. ყველა ქულა ESPN-იდან.`
    : `${current.standings.length} გუნდი ემზადება დრაფტისთვის. შარშანდელი ჩემპიონი ტახტს იცავს, დანარჩენები ანგარიშს ასწორებენ.`;

  return (
    <header className="hero" id="top">
      <CourtCanvas />
      <div className="wrap">
        <div className="kicker">Fantasy NBA · {current.label} season</div>
        <h1>
          {head ? (
            <>
              {head}
              <br />
              <span className="stroke">{tail}</span>
            </>
          ) : (
            tail
          )}
        </h1>
        <p className="lede">{lede}</p>

        {champ && (
          <div className="bug" aria-label="მოქმედი ჩემპიონი">
            <div className="tag">Champ</div>
            <div className="mid">
              <small>Defending champion · {champ.season}</small>
              <b>{clean(champ.team)}</b>
            </div>
            <div className="stats">
              <div>
                <b>{champ.rec}</b>
                <span>რეკორდი</span>
              </div>
              <div>
                <b>{champRow ? fmt(champRow.pf) : "—"}</b>
                <span>ქულები</span>
              </div>
              <div>
                <b>{champions.length}</b>
                <span>ტიტული ლიგაში</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
