import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * რიცხვის "ათვლა" 0-დან target-მდე, როცა ელემენტი ეკრანზე გამოჩნდება.
 * ტექსტიდან ("+1,144", "#103", "2,788") იღებს რიცხვს და ინარჩუნებს პრეფიქსს/ფორმატს.
 */
export function useCountUp(text: string, duration = 1100) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const m = /^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/.exec(text);
  const [shown, setShown] = useState(m && !reduced() ? `${m[1]}0${m[3]}` : text);

  useEffect(() => {
    if (!m || reduced() || !ref.current) {
      setShown(text);
      return;
    }
    const [, pre, num, post] = m;
    const target = Number(num.replace(/,/g, ""));
    const decimals = num.includes(".") ? num.split(".")[1].length : 0;
    const grouped = num.includes(",");
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / duration);
        const v = target * (1 - Math.pow(1 - k, 3));
        const s = grouped
          ? v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
          : v.toFixed(decimals);
        setShown(`${pre}${s}${post}`);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text]);

  return { ref, shown };
}
