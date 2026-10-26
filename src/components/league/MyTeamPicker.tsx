import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, UserRound, X } from "lucide-react";
import type { LeagueData } from "@/types";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setMyTeam, useMyTeam } from "@/lib/myTeam";
import { TeamAvatar } from "@/components/league/team";

/** გუნდების სია არჩევისთვის */
export function TeamChoices({ data, onPick, compact }: { data: LeagueData; onPick?: () => void; compact?: boolean }) {
  const mine = useMyTeam();
  return (
    <div className={cn("grid gap-1", compact ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4")}>
      {data.managers.map((m) => {
        const on = mine === m.tid;
        return (
          <button
            key={m.tid}
            type="button"
            onClick={() => {
              setMyTeam(on ? null : m.tid);
              onPick?.();
            }}
            className={cn(
              "flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
              on ? "bg-white/[0.1] text-foreground" : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
              !compact && "border border-white/[0.08]",
            )}
          >
            <TeamAvatar name={m.team} size={26} badge={false} />
            <span className="min-w-0 flex-1 truncate">{clean(m.team)}</span>
            {on && <Check className="h-4 w-4 shrink-0 text-win" />}
          </button>
        );
      })}
    </div>
  );
}

/** ნავბარში: ჩემი გუნდის ღილაკი და ჩამოსაშლელი არჩევანი */
export default function MyTeamPicker({ data }: { data?: LeagueData }) {
  const mine = useMyTeam();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (!data) return null;
  const team = data.managers.find((m) => m.tid === mine);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={team ? `ჩემი გუნდი: ${clean(team.team)}` : "აირჩიე შენი გუნდი"}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-1.5 text-xs text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
      >
        {team ? <TeamAvatar name={team.team} size={24} badge={false} /> : <UserRound className="mx-0.5 h-4 w-4" />}
        <span className="hidden max-w-[7rem] truncate xl:inline">{team ? clean(team.team) : "ჩემი გუნდი"}</span>
        <ChevronDown className={cn("hidden h-3.5 w-3.5 transition-transform xl:block", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <span className="text-xs font-medium text-muted-foreground">ჩემი გუნდი</span>
            {team && (
              <button type="button" onClick={() => setMyTeam(null)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" /> გაუქმება
              </button>
            )}
          </div>
          <TeamChoices data={data} compact onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
