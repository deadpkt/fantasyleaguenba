import { Link } from "react-router-dom";
import type { LiveData } from "@/types";
import { useApi } from "@/lib/useApi";
import { clean } from "@/lib/format";
import { normalizeLive } from "@/lib/normalize";
import { PlayerPhoto } from "@/components/league/team";

const pts = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** ვინ თამაშობს ახლა მთელ ლიგაში: მინი ბარათები */
export function LiveNow({ data }: { data: LiveData }) {
  const live = data.matchups
    .flatMap((m) => [m.home, m.away])
    .flatMap((t) => t.starters.filter((p) => p.status === "live").map((p) => ({ p, team: t.name })))
    .sort((a, b) => b.p.today - a.p.today);
  if (!live.length) return null;
  return (
    <section className="mb-5 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--red))]" /> ახლა თამაშობს
        <span className="text-xs font-normal text-muted-foreground tabular">{live.length}</span>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {live.map(({ p, team }) => (
          <Link
            key={p.pid}
            to={`/player/${p.pid}`}
            className="flex w-40 shrink-0 items-center gap-2.5 rounded-xl border border-[hsl(var(--red))]/25 bg-[hsl(var(--red))]/[0.04] p-2.5 transition-colors hover:border-[hsl(var(--red))]/50"
          >
            <PlayerPhoto pid={p.pid} className="h-10 w-10 shrink-0 rounded-full bg-muted object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{p.name.split(" ").slice(-1)[0]}</span>
              <span className="block truncate text-[10px] text-muted-foreground">{clean(team)}</span>
              <span className="block text-[10px] text-[hsl(var(--red))] tabular">{p.today_line?.MIN ?? 0}'</span>
            </span>
            <span className="text-lg font-semibold tabular">{pts(p.today)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** მთავარ გვერდზე: იგივე ზოლი, საკუთარი ჩატვირთვით (ჩანს მხოლოდ მაშინ, როცა ვინმე თამაშობს) */
export default function LiveStrip() {
  const { state } = useApi<LiveData>("/api/live", 30_000);
  if (state.status !== "ready") return null;
  return <LiveNow data={normalizeLive(state.data)} />;
}
