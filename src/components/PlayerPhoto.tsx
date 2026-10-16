import { useState } from "react";
import { headshot } from "../lib/logos";

/** მოთამაშის ფოტო; თუ ESPN-ზე არ არის — უბრალოდ არ ჩანს */
export default function PlayerPhoto({ pid, size = 44, className = "" }: { pid?: number; size?: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!pid || broken) return null;
  return (
    <img
      className={`headshot ${className}`}
      src={headshot(pid)}
      alt=""
      loading="lazy"
      width={size}
      height={Math.round(size * 0.73)}
      onError={() => setBroken(true)}
    />
  );
}
