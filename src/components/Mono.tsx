import { useState, type ReactNode } from "react";
import { clean, hue, initials } from "../lib/format";
import { useFan, useLogo } from "../lib/logos";
import { NBA, nbaLogo } from "../lib/nba";

/** NBA გუნდის პატარა ნიშანი (ვის გულშემატკივრობს მენეჯერი) */
function FanBadge({ abbr, size }: { abbr: string; size: number }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <img
      className="fan-badge"
      src={nbaLogo(abbr)}
      alt={NBA[abbr]?.name ?? abbr}
      title={NBA[abbr] ? `${NBA[abbr].name} fan` : undefined}
      loading="lazy"
      style={{ width: size, height: size, borderColor: NBA[abbr]?.primary }}
      onError={() => setBroken(true)}
    />
  );
}

/** გუნდის ნიშანი: ESPN-ის ლოგო (ან ინიციალები) + კუთხეში NBA გუნდის ლოგო */
export function Mono({ name, size, badge = true }: { name: string; size?: number; badge?: boolean }) {
  const logo = useLogo(name);
  const fan = useFan(name);
  const [broken, setBroken] = useState(false);
  const h = hue(name);
  const s = size ?? 34;
  const dim = size ? { width: size, height: size, fontSize: Math.round(size * 0.44) } : undefined;

  const face =
    logo && !broken ? (
      <img className="mono logo" src={logo} alt="" loading="lazy" style={dim} onError={() => setBroken(true)} />
    ) : (
      <span
        className="mono"
        style={{ ...dim, background: `linear-gradient(135deg, hsl(${h} 80% 52%), hsl(${(h + 50) % 360} 75% 36%))` }}
        aria-hidden="true"
      >
        {initials(name)}
      </span>
    );

  if (!badge || !fan || s < 24) return face;
  return (
    <span className="mono-wrap" style={{ width: s, height: s }}>
      {face}
      <FanBadge abbr={fan} size={Math.max(14, Math.round(s * 0.46))} />
    </span>
  );
}

/** ნიშანი + გუნდის სახელი */
export function Team({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <div className="team">
      <Mono name={name} />
      <span>{clean(name)}</span>
      {children}
    </div>
  );
}
