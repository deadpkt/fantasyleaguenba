import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, CalendarRange, Home, Medal, Menu, Swords, Table2, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { clean } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const ROUTES: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "მთავარი", icon: Home },
  { to: "/managers", label: "მენეჯერები", icon: Users },
  { to: "/standings", label: "ცხრილი", icon: Table2 },
  { to: "/history", label: "ისტორია", icon: BookOpen },
  { to: "/records", label: "რეკორდები", icon: Medal },
  { to: "/seasons", label: "სეზონები", icon: CalendarRange },
  { to: "/h2h", label: "H2H", icon: Swords },
];

function Brand({ league, onClick }: { league: string; onClick?: () => void }) {
  return (
    <NavLink to="/" onClick={onClick} className="flex shrink-0 items-center gap-2.5">
      <img src="/icon.png" alt="" className="h-8 w-8 rounded-lg ring-1 ring-white/15" />
      <span className="leading-none">
        <span className="block text-sm font-semibold capitalize tracking-tight">{clean(league)}</span>
        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Fantasy NBA</span>
      </span>
    </NavLink>
  );
}

function SeasonPill({ season }: { season: string }) {
  if (!season) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground tabular">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-win opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-win" />
      </span>
      {season}
    </span>
  );
}

export default function SiteHeader({ league, season }: { league: string; season: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full pt-3">
      <div className="container">
        <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/70 px-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/55">
          <Brand league={league} />

          {/* კომპიუტერი */}
          <nav className="mx-auto hidden items-center gap-0.5 rounded-xl bg-white/[0.03] p-1 lg:flex">
            {ROUTES.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                    isActive ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden lg:block">
            <SeasonPill season={season} />
          </div>

          {/* ტელეფონი / პლანშეტი */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <span className="hidden sm:inline-flex">
              <SeasonPill season={season} />
            </span>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-white/10 bg-white/[0.04]" aria-label="მენიუ">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[300px] flex-col border-white/10 bg-zinc-950 p-0">
                <div className="flex items-center gap-3 border-b border-white/10 p-5">
                  <img src="/icon.png" alt="" className="h-10 w-10 rounded-xl ring-1 ring-white/15" />
                  <div>
                    <SheetTitle className="capitalize">{clean(league)}</SheetTitle>
                    <SheetDescription>Fantasy NBA · {season}</SheetDescription>
                  </div>
                </div>
                <nav className="flex flex-col gap-1 p-3">
                  {ROUTES.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                          isActive ? "bg-white text-black" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-auto border-t border-white/10 p-5 text-xs text-muted-foreground">მონაცემები: ESPN Fantasy</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
