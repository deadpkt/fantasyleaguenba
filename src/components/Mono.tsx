import type { ReactNode } from "react";
import { clean, hue, initials } from "../lib/format";

/** გუნდის მონოგრამა: ინიციალები სახელიდან გამოთვლილ ფერად ფონზე */
export function Mono({ name }: { name: string }) {
  const h = hue(name);
  return (
    <span
      className="mono"
      style={{ background: `linear-gradient(135deg, hsl(${h} 80% 52%), hsl(${(h + 50) % 360} 75% 36%))` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

/** მონოგრამა + გუნდის სახელი */
export function Team({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <div className="team">
      <Mono name={name} />
      <span>{clean(name)}</span>
      {children}
    </div>
  );
}
