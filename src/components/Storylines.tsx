import type { LeagueData } from "../types";
import { clean, fmt, signedPct } from "../lib/format";
import CountUp from "./CountUp";
import { Mono } from "./Mono";
import PlayerPhoto from "./PlayerPhoto";
import Section from "./Section";

function Trophy() {
  return (
    <svg className="trophy" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset=".5" stopColor="#ffc940" />
          <stop offset="1" stopColor="#b8860b" />
        </linearGradient>
      </defs>
      <path
        fill="url(#tg)"
        opacity=".9"
        d="M62 30h76v14h26c0 34-14 52-36 56-6 14-16 22-28 25v20h22v14H78v-14h22v-20c-12-3-22-11-28-25-22-4-36-22-36-56h26zm-12 28c2 16 8 26 16 30-3-9-4-19-4-30zm100 0h-12c0 11-1 21-4 30 8-4 14-14 16-30z"
      />
      <circle cx="100" cy="66" r="18" fill="#ff8a3d" />
      <path d="M82 66h36M100 48v36" stroke="#5a2a10" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/** "სიუჟეტები" — მთავარი ფაქტები ბარათებად */
export default function Storylines({ data }: { data: LeagueData }) {
  const champ = data.champions[data.champions.length - 1];
  const last = data.seasons.find((s) => s.complete);
  const high = data.records.find((r) => r.k.includes("მაღალი"));
  const steal = last?.draft?.steals[0];
  const lucky = last?.luck[0];
  const mvp = last?.awards.mvp;

  return (
    <Section id="story" title="Storylines" sub="რაც უნდა იცოდე ახალ სეზონამდე">
      <div className="bento">
        {champ && (
          <div className="glass tile champ">
            <Trophy />
            <Mono name={champ.team} size={64} />
            <div className="lbl">Defending champion · {champ.season}</div>
            <div className="nm">{clean(champ.team)}</div>
            <div className="sub">
              {champ.rec}
              {champ.runner && ` · ფინალში დაამარცხა ${clean(champ.runner)}`}
            </div>
          </div>
        )}
        {mvp && (
          <div className="glass tile red has-photo">
            <PlayerPhoto pid={mvp.pid} size={150} className="tile-photo" />
            <div className="lbl">Season MVP</div>
            <div className="nm">{mvp.player}</div>
            <CountUp className="big num" value={fmt(mvp.total)} />
            <div className="sub">FP სეზონში · {mvp.avg}/თამაში</div>
          </div>
        )}
        {high && (
          <div className="glass tile blue">
            <div className="lbl">Record week</div>
            <CountUp className="big num" value={high.v} />
            <div className="nm with-logo" style={{ fontSize: 24 }}>
              <Mono name={high.who} size={28} />
              {clean(high.who)}
            </div>
            <div className="sub">{high.when}</div>
          </div>
        )}
        {steal && (
          <div className="glass tile green has-photo">
            <PlayerPhoto pid={steal.pid} size={150} className="tile-photo" />
            <div className="lbl">Steal of the draft</div>
            <div className="nm">{steal.player}</div>
            <div className="big num">
              #{steal.n}→#{steal.rank}
            </div>
            <div className="sub">
              {clean(steal.team)} · {fmt(steal.total)} FP
            </div>
          </div>
        )}
        {lucky && (
          <div className="glass tile">
            <div className="lbl">Luckiest manager</div>
            <div className="nm with-logo">
              <Mono name={lucky.name} size={28} />
              {clean(lucky.name)}
            </div>
            <CountUp className="big num" style={{ color: "var(--gold)" }} value={signedPct(lucky.luck)} />
            <div className="sub">რეალური მოგება % მინუს all-play %</div>
          </div>
        )}
      </div>
    </Section>
  );
}
