import { useEffect, useState } from "react";
import type { DraftInfo } from "../types";

const TZ = "Asia/Tbilisi";
const pad = (n: number) => String(n).padStart(2, "0");
const DAYS = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];
const MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];

/** თარიღი თბილისის დროით, ქართულად (ბრაუზერის ენის მიუხედავად) */
function tbilisi(ms: number) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  );
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { day: `${DAYS[wd]}, ${Number(p.day)} ${MONTHS[Number(p.month) - 1]}`, time: `${p.hour}:${p.minute}` };
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** დრაფტამდე დარჩენილი დრო — წამობრივად; დაწყების მერე "LIVE" */
export default function DraftCountdown({ draft, drafted }: { draft: DraftInfo | null; drafted: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!draft?.date || drafted) return null;

  const left = draft.date - now;
  const { day, time } = tbilisi(draft.date);
  const meta = [draft.type === "SNAKE" ? "Snake" : draft.type, draft.pick_seconds ? `${draft.pick_seconds} წმ პიკზე` : null]
    .filter(Boolean)
    .join(" · ");

  if (left <= 0) {
    return (
      <div className="countdown live">
        <div className="cd-head">
          <span className="cd-dot" />
          Draft night · LIVE
        </div>
        <div className="cd-live">დრაფტი მიმდინარეობს</div>
        <div className="cd-when ka">გახსენი ESPN Fantasy და შედი Draft Room-ში</div>
      </div>
    );
  }

  const p = parts(left);
  const cells: [number, string][] = [
    [p.d, "დღე"],
    [p.h, "საათი"],
    [p.m, "წუთი"],
    [p.s, "წამი"],
  ];
  return (
    <div className="countdown" role="timer" aria-label={`დრაფტამდე ${p.d} დღე ${p.h} საათი ${p.m} წუთი`}>
      <div className="cd-head">
        <span className="cd-dot" />
        Draft night · {meta}
      </div>
      <div className="cd-grid">
        {cells.map(([v, label], i) => (
          <div className="cd-cell" key={label}>
            <div className="cd-num num">{i === 0 ? v : pad(v)}</div>
            <div className="cd-lbl ka">{label}</div>
          </div>
        ))}
      </div>
      <div className="cd-when ka">
        {day} · {time} <span>თბილისის დროით</span>
      </div>
    </div>
  );
}
