import { useState } from "react";
import { Bell } from "lucide-react";
import type { LeagueData } from "@/types";
import { clean } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function NotificationBell({ data }: { data?: LeagueData }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  const injured = data.managers.flatMap((m) => m.roster.filter((p) => p.injury).map((p) => `${p.name} (${clean(m.team)}): ${p.injury!.replace(/_/g, " ")}`));
  const tradeCount = data.trades?.current.length ?? 0;
  const items = [...injured.slice(0, 6), ...(tradeCount ? [`ამ სეზონში ${tradeCount} ტრეიდია დაფიქსირებული`] : []), `ESPN მონაცემები ავტომატურად ახლდება`];
  return <div className="relative"><Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-transparent" aria-label="შეტყობინებები" onClick={() => setOpen(!open)}><Bell className="h-4 w-4" />{injured.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}</Button>{open && <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl"><div className="px-2 py-2 text-sm font-semibold">შეტყობინებები</div>{items.map((x, i) => <div key={`${x}-${i}`} className="border-t border-white/5 px-2 py-2 text-xs text-muted-foreground">{x}</div>)}</div>}</div>;
}
