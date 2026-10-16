import type { CSSProperties } from "react";
import { useCountUp } from "../lib/useCountUp";

/** რიცხვი, რომელიც ეკრანზე გამოჩენისას 0-დან "აითვლება" */
export default function CountUp({ value, className, style }: { value: string | number; className?: string; style?: CSSProperties }) {
  const { ref, shown } = useCountUp(String(value));
  return (
    <span ref={ref} className={className} style={style}>
      {shown}
    </span>
  );
}
