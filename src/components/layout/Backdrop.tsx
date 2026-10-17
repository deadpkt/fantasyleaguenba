import { useEffect, useState } from "react";

/** საიტის ფონი: შავი, მკრთალი წერტილოვანი ბადე და ხაზოვანი ფარი —
 *  ბურთი რამდენიმე წამში ერთხელ ეკრანს გადაკვეთს და კალათში ვარდება. */
const DUR = "9s";
// ფრენა 0 → 0.15, რკალიდან ბადეში ჩავარდნა 0.15 → 0.19, დანარჩენი — პაუზა
const T = "0;0.15;0.19;1";
const ARC = "M150 1000 Q 820 -380 1380 300 L1380 430";

export default function Backdrop() {
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setMotion(!m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* წერტილოვანი ბადე — კიდეებისკენ ქრება */}
      <div className="backdrop-dots absolute inset-0" />
      {/* რბილი ნათება ფარის უკან */}
      <div className="absolute right-[-10%] top-[5%] h-[60vh] w-[60vh] rounded-full bg-orange-500/[0.07] blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-blue-500/[0.05] blur-[120px]" />

      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMid slice" className="absolute inset-0 h-full w-full opacity-80 max-md:opacity-30">
        <defs>
          <linearGradient id="bd-trail" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#f97316" stopOpacity="0" />
            <stop offset="1" stopColor="#fb923c" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="bd-ball" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fdba74" />
            <stop offset="0.55" stopColor="#f97316" />
            <stop offset="1" stopColor="#7c2d12" />
          </radialGradient>
          <linearGradient id="bd-swish" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff7ed" />
            <stop offset="0.5" stopColor="#fdba74" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
          <filter id="bd-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* მთელი სცენა მარჯვენა კიდესთან */}
        <g transform="translate(115 -40)">

        {/* ფარი, დგამი */}
        <g fill="none" stroke="white" strokeOpacity="0.14" strokeWidth="2" strokeLinecap="round">
          <path d="M1446 170 V 340" strokeWidth="5" strokeOpacity="0.2" />
          <rect x="1440" y="170" width="12" height="170" rx="2" />
          <path d="M1452 255 H 1520 V 900" strokeWidth="6" strokeOpacity="0.08" />
          <path d="M1428 300 H 1440" />
        </g>

        {/* ბადე — ჩავარდნისას ირხევა */}
        <g transform="translate(1380 302)">
          <g>
            {motion && (
              <animateTransform
                attributeName="transform"
                type="scale"
                dur={DUR}
                repeatCount="indefinite"
                values="1 1;1 1;1 1.3;1 0.92;1 1;1 1"
                keyTimes="0;0.15;0.17;0.2;0.23;1"
              />
            )}
            <path
              d="M-48 0 L-34 74 M-24 0 L-17 74 M0 0 V74 M24 0 L17 74 M48 0 L34 74 M-44 25 H44 M-39 50 H39 M-34 74 H34"
              fill="none"
              stroke="white"
              strokeOpacity="0.16"
              strokeWidth="1.5"
            />
          </g>
        </g>

        {/* კვალი */}
        {motion && (
          <path d={ARC} pathLength={1000} fill="none" stroke="url(#bd-trail)" strokeWidth="5" strokeLinecap="round" strokeDasharray="160 2000" opacity="0">
            <animate attributeName="stroke-dashoffset" dur={DUR} repeatCount="indefinite" values="160;-770;-840;-840" keyTimes={T} />
            <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" values="0;0.55;0;0" keyTimes={T} />
          </path>
        )}

        {/* ბურთი */}
        {motion && (
          <g opacity="0">
            <animateMotion dur={DUR} repeatCount="indefinite" path={ARC} keyPoints="0;0.93;1;1" keyTimes={T} calcMode="linear" />
            <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;0.02;0.18;0.22;1" />
            <circle r="30" fill="#f97316" opacity="0.35" filter="url(#bd-glow)" />
            <g>
              <animateTransform attributeName="transform" type="rotate" dur={DUR} repeatCount="indefinite" values="0;-540;-600;-600" keyTimes={T} />
              <circle r="21" fill="url(#bd-ball)" />
              <g fill="none" stroke="#1c1210" strokeWidth="1.6" strokeLinecap="round">
                <path d="M-21 0 H21 M0 -21 V21 M-13.5 -16 C-8 -8 -8 8 -13.5 16 M13.5 -16 C8 -8 8 8 13.5 16" />
              </g>
            </g>
          </g>
        )}

        {/* რკალი (ბურთის წინ, რომ შიგნით ჩავარდნა ჩანდეს) */}
        <ellipse cx="1380" cy="302" rx="48" ry="8" fill="none" stroke="#f97316" strokeOpacity="0.45" strokeWidth="3.5">
          {motion && <animate attributeName="stroke-opacity" dur={DUR} repeatCount="indefinite" values="0.45;0.45;1;0.45;0.45" keyTimes="0;0.15;0.17;0.24;1" />}
        </ellipse>

        {/* SWISH — წვეთები, სიჩქარის ხაზები და წარწერა */}
        {motion && <Splash />}
        </g>
      </svg>
    </div>
  );
}

// ჩავარდნის მომენტი (კადრის წილი): ბურთი რკალს ~0.155-ზე გადის
const K = "0;0.155;0.2;0.28;1";

/** ჩავარდნისას: წვეთების შხეფი, სიჩქარის ხაზები და "SWISH!" */
function Splash() {
  const drops = Array.from({ length: 14 }, (_, i) => {
    const a = ((-165 + (i * 150) / 13) * Math.PI) / 180;
    const d = 55 + ((i * 37) % 3) * 28;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: 2 + ((i * 7) % 3) * 0.8, warm: i % 3 !== 0 };
  });
  const rays = Array.from({ length: 10 }, (_, i) => (i * 360) / 10 + 18);

  return (
    <g transform="translate(1380 300)">
      {/* წვეთები — ზემოთ ისვრის და გრავიტაციით ცვივა */}
      {drops.map(({ dx, dy, r, warm }, i) => {
        const mid = `${(dx * 0.75).toFixed(1)} ${(dy * 0.85).toFixed(1)}`;
        const end = `${dx.toFixed(1)} ${(dy * 0.2 + 55).toFixed(1)}`;
        return (
          <circle key={i} r={r} fill={warm ? "#fdba74" : "#ffffff"} opacity="0">
            <animateTransform attributeName="transform" type="translate" dur={DUR} repeatCount="indefinite" keyTimes={K} values={`0 0;0 0;${mid};${end};${end}`} />
            <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" keyTimes={K} values="0;0;0.95;0;0" />
          </circle>
        );
      })}

      {/* სიჩქარის ხაზები */}
      <g opacity="0" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" keyTimes="0;0.155;0.17;0.24;1" values="0;0;0.9;0;0" />
        <animateTransform attributeName="transform" type="scale" dur={DUR} repeatCount="indefinite" keyTimes="0;0.155;0.24;1" values="0.6;0.6;1.5;1.5" />
        {rays.map((deg) => (
          <g key={deg} transform={`scale(1 0.55) rotate(${deg})`}>
            <line x1="58" y1="0" x2="78" y2="0" />
          </g>
        ))}
      </g>

      {/* SWISH! */}
      <g transform="translate(-10 -78)">
        <g opacity="0">
          <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" keyTimes="0;0.16;0.18;0.27;0.31;1" values="0;0;1;1;0;0" />
          <animateTransform attributeName="transform" type="scale" dur={DUR} repeatCount="indefinite" keyTimes="0;0.16;0.19;0.22;0.31;1" values="0.3;0.3;1.18;1;1.06;1.06" />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="44"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="3"
            fill="url(#bd-swish)"
            stroke="#7c2d12"
            strokeWidth="1"
            style={{ fontFamily: "Geist, system-ui, sans-serif" }}
          >
            SWISH!
          </text>
        </g>
      </g>
    </g>
  );
}
