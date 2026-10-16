/** ზედმეტი ჰარების მოშორება გუნდის სახელებიდან */
export const clean = (s: string | null | undefined): string => String(s ?? "").replace(/\s+/g, " ").trim();

/** მხოლოდ ასოები/ციფრები — მონოგრამისა და ფერისთვის */
export const plain = (s: string): string => clean(s).replace(/[^\p{L}\p{N}\s'_-]/gu, "").trim();

export const fmt = (n: number): string => Number(n).toLocaleString("en-US");

export const signedPct = (x: number): string => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;

/** .842 სტილის პროცენტი */
export const pct3 = (x: number): string => x.toFixed(3).replace(/^0/, "");

/** სახელიდან სტაბილური ფერი (0–359) */
export function hue(name: string): number {
  let h = 0;
  for (const c of plain(name)) h = (h * 31 + (c.codePointAt(0) ?? 0)) % 360;
  return h;
}

export function initials(name: string): string {
  const p = plain(name).replace(/_/g, " ").split(/\s+/).filter(Boolean);
  const a = p[0] ?? "?";
  return (a[0] + (p[1] ? p[1][0] : a[1] ?? "")).toUpperCase();
}

/** სითბური რუკის ფერი: მუქი ლურჯი → ლურჯი → იისფერი → წითელი */
export function heatColor(k: number): string {
  const stops = [
    [26, 32, 64],
    [61, 123, 255],
    [176, 75, 255],
    [255, 59, 78],
  ];
  const p = Math.max(0, Math.min(1, k)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  const f = p - i;
  const c = stops[i].map((v, j) => Math.round(v + (stops[i + 1][j] - v) * f));
  return `rgb(${c.join(",")})`;
}
