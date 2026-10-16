import type { ReactNode } from "react";

/** სექციის ჩარჩო: დიდი სათაური + ქართული ახსნა */
export default function Section({
  id,
  title,
  sub,
  children,
}: {
  id: string;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section id={id}>
      <div className="sh">
        <h2>{title}</h2>
        {sub && <span className="ka">{sub}</span>}
      </div>
      {children}
    </section>
  );
}
