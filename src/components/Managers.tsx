import { useState, type CSSProperties } from "react";
import type { Manager } from "../types";
import { clean, fmt } from "../lib/format";
import { espnImage } from "../lib/logos";
import { NBA, nbaLogo } from "../lib/nba";
import { Mono } from "./Mono";
import Section from "./Section";

const tier = (ovr: number) => (ovr >= 90 ? "t90" : ovr >= 80 ? "t80" : ovr >= 70 ? "t70" : "");

function Photo({ m }: { m: Manager }) {
  const [broken, setBroken] = useState(false);
  if (!m.logo || broken) return <Mono name={m.team} size={112} badge={false} />;
  return <img className="mgr-photo" src={espnImage(m.logo)} alt={clean(m.team)} loading="lazy" onError={() => setBroken(true)} />;
}

function Card({ m }: { m: Manager }) {
  const nba = m.fan ? NBA[m.fan] : undefined;
  const primary = nba?.primary ?? "#3d7bff";
  const secondary = nba?.secondary ?? "#ff3b4e";
  return (
    <article
      className="mgr"
      style={{ "--c1": primary, "--c2": secondary } as CSSProperties}
    >
      {m.fan && <img className="mgr-bg" src={nbaLogo(m.fan)} alt="" aria-hidden="true" loading="lazy" />}
      <div className="mgr-top">
        <div className="mgr-ring">
          <Photo m={m} />
        </div>
        {m.ovr != null ? <span className={`ovr ${tier(m.ovr)}`}>{m.ovr}</span> : <span className="chip gold">Rookie</span>}
      </div>

      <h3 className="mgr-name">{clean(m.team)}</h3>
      {nba && (
        <div className="mgr-fan">
          <img src={nbaLogo(m.fan!)} alt="" loading="lazy" />
          <span>{nba.name} fan</span>
        </div>
      )}

      {m.rookie ? (
        <p className="mgr-rookie ka">პირველი სეზონი ლიგაში. ისტორია ახლა იწერება ✍️</p>
      ) : (
        <div className="mgr-stats">
          <div>
            <b className="num">
              {m.w}-{m.l}
            </b>
            <span>W-L</span>
          </div>
          <div>
            <b className="num">{fmt(m.ppg)}</b>
            <span>PPG</span>
          </div>
          <div>
            <b className="num">{fmt(m.best_week)}</b>
            <span>Best wk</span>
          </div>
          <div>
            <b className="num">{m.titles ? "◆".repeat(m.titles) : "0"}</b>
            <span>Titles</span>
          </div>
        </div>
      )}

      {m.seasons.length > 0 && (
        <div className="mgr-hist">
          {m.seasons.map((s) => (
            <span key={s.season}>
              {s.season} · {clean(s.team)} · {s.rec}
              {s.champ && " 🏆"}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function Managers({ managers }: { managers: Manager[] }) {
  // ჯერ ტიტულები, მერე OVR, ახალბედები ბოლოს
  const sorted = [...managers].sort((a, b) => b.titles - a.titles || (b.ovr ?? 0) - (a.ovr ?? 0));
  return (
    <Section id="managers" title="The Managers" sub="ფოტო ESPN-იდან, ფონზე — NBA გუნდი, რომელსაც გულშემატკივრობს.">
      <div className="mgrs">
        {sorted.map((m) => (
          <Card key={m.team} m={m} />
        ))}
      </div>
    </Section>
  );
}
