import type { LuckRow } from "../../types";
import { clean, signedPct } from "../../lib/format";

/** იღბლის ინდექსი: ორმხრივი ზოლები ნულის გარშემო */
export default function LuckChart({ rows }: { rows: LuckRow[] }) {
  const W = 520;
  const rh = 32;
  const top = 8;
  const H = top + rows.length * rh + 22;
  const lab = 170;
  const half = (W - lab - 10) / 2;
  const mid = lab + half;
  const m = Math.max(0.05, ...rows.map((r) => Math.abs(r.luck)));
  const sc = (v: number) => (v / m) * (half - 40);

  return (
    <div className="glass pad">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="იღბლის ინდექსი">
        <line x1={mid} y1={top - 4} x2={mid} y2={H - 20} stroke="rgba(255,255,255,.25)" />
        {rows.map((r, i) => {
          const y = top + i * rh;
          const w = sc(r.luck);
          const pos = w >= 0;
          return (
            <g key={r.name}>
              <text className="nm" x={lab - 10} y={y + 20} textAnchor="end">
                {clean(r.name).slice(0, 22)}
              </text>
              <rect
                x={pos ? mid : mid + w}
                y={y + 6}
                width={Math.max(2, Math.abs(w))}
                height={rh - 12}
                rx={5}
                fill={pos ? "#34d399" : "#ff5b6b"}
              />
              <text x={pos ? mid + w + 6 : mid + w - 6} y={y + 20} textAnchor={pos ? "start" : "end"}>
                {signedPct(r.luck)}
              </text>
            </g>
          );
        })}
        <text x={mid} y={H - 4} textAnchor="middle">
          0%
        </text>
      </svg>
      <p className="note">All-play: შენი ქულა ყოველ კვირას ყველა გუნდის წინააღმდეგ. მარჯვნივ იღბლიანები, მარცხნივ უიღბლოები.</p>
    </div>
  );
}
