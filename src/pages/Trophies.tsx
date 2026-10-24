import { useId } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { key } from "@/lib/season";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import { TeamAvatar } from "@/components/league/team";

const METAL = {
  gold: ["#fef3c7", "#f59e0b", "#78350f"],
  silver: ["#f8fafc", "#94a3b8", "#334155"],
  bronze: ["#fde3c8", "#c2773a", "#5b2a0e"],
};

function Cup({ metal, className }: { metal: keyof typeof METAL; className?: string }) {
  const id = useId();
  const [a, b, c] = METAL[metal];
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset=".45" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      {/* სახელურები */}
      <path d="M26 30 C4 30 4 66 34 72 M94 30 C116 30 116 66 86 72" fill="none" stroke={`url(#${id}g)`} strokeWidth="7" strokeLinecap="round" />
      {/* თასი */}
      <path d="M24 18 H96 V44 C96 74 80 92 60 96 C40 92 24 74 24 44 Z" fill={`url(#${id}g)`} />
      <path d="M34 24 C34 52 40 70 52 82" fill="none" stroke="white" strokeOpacity=".45" strokeWidth="4" strokeLinecap="round" />
      {/* ბურთი */}
      <circle cx="60" cy="48" r="13" fill="#ea580c" opacity=".9" />
      <path d="M47 48 H73 M60 35 V61" stroke="#431407" strokeWidth="2" fill="none" />
      {/* ფეხი და ძირი */}
      <rect x="54" y="96" width="12" height="20" fill={`url(#${id}g)`} />
      <rect x="36" y="116" width="48" height="10" rx="2" fill={`url(#${id}g)`} />
      <rect x="28" y="126" width="64" height="22" rx="3" fill="#1c1917" stroke={b} strokeOpacity=".5" />
    </svg>
  );
}

function Shelf({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      <div className="relative">
        <div className="flex flex-wrap items-end justify-center gap-6 px-4 pb-4 pt-6 sm:justify-start sm:gap-10">{children}</div>
        {/* თარო */}
        <div className="h-3 rounded-sm bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-900 shadow-[0_18px_30px_-10px_rgba(0,0,0,0.9)]" />
        <div className="mx-2 h-6 bg-gradient-to-b from-white/[0.06] to-transparent [mask-image:linear-gradient(#000,transparent)]" />
      </div>
    </section>
  );
}

function TrophyItem({ metal, season, team, line, big, i }: { metal: keyof typeof METAL; season: string; team: string; line: string; big?: boolean; i: number }) {
  const data = useData();
  const tid = data.managers.find((m) => key(m.team) === key(team))?.tid;
  return (
    <Link
      to={tid ? `/team/${tid}` : "/history"}
      className="trophy group/t relative flex flex-col items-center text-center [perspective:600px]"
      style={{ animationDelay: `${i * 120}ms` }}
    >
      <div className="relative transition-transform duration-500 ease-out [transform-style:preserve-3d] group-hover/t:[transform:rotateY(18deg)_translateY(-6px)]">
        <div className={cn("absolute inset-x-4 bottom-0 h-6 rounded-full blur-xl", metal === "gold" ? "bg-amber-400/40" : metal === "silver" ? "bg-slate-300/25" : "bg-orange-700/30")} />
        <Cup metal={metal} className={cn("relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]", big ? "h-40 w-32 sm:h-48 sm:w-36" : "h-28 w-24")} />
        <span className="trophy-shine pointer-events-none absolute inset-0" />
      </div>
      <div className="mt-2 rounded-md border border-white/10 bg-black/60 px-3 py-1.5">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{season}</div>
        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold">
          <TeamAvatar name={team} size={16} badge={false} /> {clean(team)}
        </div>
        <div className="text-[11px] text-muted-foreground">{line}</div>
      </div>
    </Link>
  );
}

export default function Trophies() {
  const data = useData();
  const champs = [...data.champions].reverse();
  const finals = champs.filter((c) => c.runner);
  const scorers = data.seasons.filter((s) => s.complete && s.awards.pf?.team);

  return (
    <>
      <PageHeader title="ტროფეების თარო" description="ლიგის ყველა ბანერი ერთ ადგილას. თასზე დაჭერით გუნდის პროფილზე გადახვალ." />
      <div className="space-y-12">
        <Shelf title="🏆 ჩემპიონები">
          {champs.map((c, i) => (
            <TrophyItem key={c.season} i={i} big metal="gold" season={c.season} team={c.team} line={`${c.rec} · ჩემპიონი`} />
          ))}
          <div className="flex flex-col items-center opacity-60">
            <div className="grid h-40 w-32 place-items-center rounded-2xl border-2 border-dashed border-white/15 text-4xl sm:h-48 sm:w-36">?</div>
            <div className="mt-2 rounded-md border border-dashed border-white/15 px-3 py-1.5 text-center">
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{data.current.label}</div>
              <div className="text-sm">ადგილი თავისუფალია</div>
            </div>
          </div>
        </Shelf>

        {finals.length > 0 && (
          <Shelf title="🥈 ფინალისტები">
            {finals.map((c, i) => (
              <TrophyItem key={c.season} i={i} metal="silver" season={c.season} team={c.runner!} line={`ფინალი vs ${clean(c.team)}`} />
            ))}
          </Shelf>
        )}

        {scorers.length > 0 && (
          <Shelf title="🔥 სეზონის ყველაზე მეტი ქულა">
            {scorers.map((s, i) => (
              <TrophyItem
                key={s.label}
                i={i}
                metal="bronze"
                season={s.label}
                team={s.awards.pf.team}
                line={`${fmt(s.awards.pf.v)} ქულა`}
              />
            ))}
          </Shelf>
        )}
      </div>
    </>
  );
}
