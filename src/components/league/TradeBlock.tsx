import { Link } from "react-router-dom";
import { Lock, Store } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { injuryLabel } from "@/lib/injury";
import type { Manager, RosterPlayer } from "@/types";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

type Item = { p: RosterPlayer; m: Manager };

/** ტრეიდის ბლოკის მოთამაშეები ESPN-იდან: გასაყიდად გამოტანილი და ხელშეუხებელი */
export function useTradeBlock() {
  const { current, managers } = useData();
  const find = (tid: number, pid: number): Item | null => {
    const m = managers.find((x) => x.tid === tid);
    const p = m?.roster.find((r) => r.pid === pid);
    return m && p ? { p, m } : null;
  };
  const rows = current.table ?? [];
  const onBlock = rows.flatMap((r) => (r.on_block ?? []).map((pid) => find(r.tid, pid))).filter(Boolean) as Item[];
  const untouchable = rows.flatMap((r) => (r.untouchable ?? []).map((pid) => find(r.tid, pid))).filter(Boolean) as Item[];
  onBlock.sort((a, b) => b.p.per_game - a.p.per_game);
  return { onBlock, untouchable, blockIds: new Set(onBlock.map((x) => x.p.pid)), lockIds: new Set(untouchable.map((x) => x.p.pid)) };
}

function BlockCard({ p, m }: Item) {
  return (
    <Link to={`/player/${p.pid}`} className="flex gap-3 rounded-2xl border border-[hsl(var(--blue))]/25 bg-card p-3.5 transition-colors hover:border-[hsl(var(--blue))]/50">
      <PlayerPhoto pid={p.pid} className="h-14 w-14 shrink-0 rounded-full bg-muted object-cover" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold">{p.name}</span>
              {p.injury && <span className="shrink-0 rounded bg-loss/15 px-1 text-[9px] font-semibold text-loss">{injuryLabel(p.injury)}</span>}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {p.pos} · {p.pro}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-semibold leading-none tabular">{p.gp ? p.avg : p.per_game}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{p.gp ? "საშ. თამაშზე" : "პროგნოზი"}</div>
          </div>
        </div>
        {p.season_line && p.gp > 0 && (
          <div className="flex flex-wrap gap-1">
            {(["PTS", "REB", "AST"] as const).map((k) => (
              <span key={k} className="inline-flex items-baseline gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] tabular">
                <span className="font-semibold">{p.season_line![k]}</span>
                <span className="text-[9px] text-muted-foreground">{k}</span>
              </span>
            ))}
            <span className="inline-flex items-baseline gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] tabular">
              <span className="font-semibold">{fmt(p.total ?? 0)}</span>
              <span className="text-[9px] text-muted-foreground">სულ</span>
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <TeamAvatar name={m.team} size={16} badge={false} />
          <span className="truncate">{clean(m.team)} ყიდის</span>
        </div>
      </div>
    </Link>
  );
}

/** ტრეიდების გვერდზე: ვის რა აქვს გასაყიდად ESPN-ზე */
export default function TradeBlock() {
  const { onBlock, untouchable } = useTradeBlock();
  return (
    <section className="mb-10 space-y-4">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Store className="h-5 w-5 text-[hsl(var(--blue))]" /> ტრეიდის ბლოკი
        </h2>
        <p className="text-sm text-muted-foreground">მოთამაშეები, რომლებიც მენეჯერებმა ESPN-ზე გასაყიდად გამოიტანეს. ახლდება ყოველ წუთს.</p>
      </div>

      {onBlock.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-muted-foreground">
          ახლა ბლოკზე არავინაა. მოთამაშის გამოსატანად ESPN-ის აპში: შენი გუნდი → მოთამაშე → <span className="text-foreground">Add to Trade Block</span>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {onBlock.map((x) => (
            <BlockCard key={x.p.pid} {...x} />
          ))}
        </div>
      )}

      {untouchable.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-gold" /> ხელშეუხებელი: ამათზე შეთავაზება აზრს მოკლებულია
          </div>
          <div className="flex flex-wrap gap-2">
            {untouchable.map(({ p, m }) => (
              <Link
                key={p.pid}
                to={`/player/${p.pid}`}
                className={cn("flex items-center gap-2 rounded-full border border-[hsl(var(--gold))]/25 bg-card py-1 pl-1 pr-3 text-xs transition-colors hover:border-[hsl(var(--gold))]/50")}
              >
                <PlayerPhoto pid={p.pid} className="h-7 w-7 rounded-full bg-muted object-cover" />
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">{clean(m.team)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
