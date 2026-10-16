import { useEffect, useRef } from "react";

/** ჰეროს ფონზე კალათბურთის მოედნის ხაზები (დეკორატიული) */
export default function CourtCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => {
      const r = cv.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      cv.width = r.width * d;
      cv.height = r.height * d;
      const g = cv.getContext("2d");
      if (!g) return;
      g.scale(d, d);
      const W = r.width;
      const H = r.height;
      const grad = g.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "rgba(255,59,78,.55)");
      grad.addColorStop(1, "rgba(61,123,255,.55)");
      g.strokeStyle = grad;
      g.lineWidth = 1.5;
      const cx = W * 0.78;
      const cy = H * 0.55;
      const s = Math.min(W, H) * 0.9;
      const circle = (rad: number) => {
        g.beginPath();
        g.arc(cx, cy, rad, 0, Math.PI * 2);
        g.stroke();
      };
      circle(s * 0.16);
      circle(s * 0.06);
      g.beginPath();
      g.moveTo(cx, 0);
      g.lineTo(cx, H);
      g.stroke();
      g.beginPath();
      g.arc(W + s * 0.05, cy, s * 0.52, Math.PI * 0.5, Math.PI * 1.5);
      g.stroke();
      g.strokeRect(W - s * 0.3, cy - s * 0.16, s * 0.32, s * 0.32);
      g.strokeStyle = "rgba(255,255,255,.02)";
      for (let x = 0; x < W; x += 46) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, H);
        g.stroke();
      }
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
}
