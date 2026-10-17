import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import type { DraftInfo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tone } from "@/lib/utils";

const TZ = "Asia/Tbilisi";
const DAYS = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];
const MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
const pad = (n: number) => String(n).padStart(2, "0");

/** თარიღი თბილისის დროით, ქართულად (ბრაუზერის ენის მიუხედავად) */
function tbilisi(ms: number) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  );
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return `${DAYS[wd]}, ${Number(p.day)} ${MONTHS[Number(p.month) - 1]} · ${p.hour}:${p.minute}`;
}

export default function Countdown({ draft, drafted }: { draft: DraftInfo | null; drafted: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!draft?.date || drafted) return null;

  const left = Math.max(0, draft.date - now);
  const s = Math.floor(left / 1000);
  const cells: [string, string][] = [
    [String(Math.floor(s / 86400)), "დღე"],
    [pad(Math.floor((s % 86400) / 3600)), "საათი"],
    [pad(Math.floor((s % 3600) / 60)), "წუთი"],
    [pad(s % 60), "წამი"],
  ];
  const meta = [draft.type === "SNAKE" ? "Snake" : draft.type, draft.pick_seconds ? `${draft.pick_seconds} წმ პიკზე` : null].filter(Boolean).join(" · ");

  return (
    <Card className="tone-card" style={tone("blue")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4 text-[hsl(var(--blue))]" />
            დრაფტამდე
          </CardTitle>
          {left === 0 ? <Badge variant="destructive">LIVE</Badge> : <Badge variant="secondary">{meta}</Badge>}
        </div>
        <CardDescription>{tbilisi(draft.date)} · თბილისის დროით</CardDescription>
      </CardHeader>
      <CardContent>
        {left === 0 ? (
          <p className="text-sm">დრაფტი მიმდინარეობს — შედი ESPN-ის Draft Room-ში.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2" role="timer" aria-label="დრაფტამდე დარჩენილი დრო">
            {cells.map(([v, l]) => (
              <div key={l} className="rounded-lg border border-white/10 bg-black/40 px-2 py-3 text-center">
                <div className="overflow-hidden text-3xl font-bold tabular sm:text-4xl">
                  <span key={v} className="digit-in bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                    {v}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
