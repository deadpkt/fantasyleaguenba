import { useEffect, useRef, useState } from "react";

/** რიცხვი, რომელიც ეკრანზე გამოჩენისას 0-დან ითვლება */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1300,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / duration);
        setV(value * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** ტექსტი: თუ რიცხვია ("41,530", "93.9") — ითვლება, თუ არა ("16-3") — ისე ჩანს */
export function CountText({ text }: { text: string }) {
  const t = String(text).trim();
  if (!/^\d[\d,]*(\.\d+)?$/.test(t)) return <>{t}</>;
  const decimals = t.includes(".") ? t.split(".")[1].length : 0;
  return <CountUp value={Number(t.replace(/,/g, ""))} decimals={decimals} />;
}
