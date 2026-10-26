import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  CalendarRange,
  ChevronDown,
  Clapperboard,
  Home,
  Medal,
  Menu,
  Radio,
  Swords,
  Table2,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clean } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { LeagueData } from "@/types";
import NotificationBell from "@/components/league/NotificationBell";
import MyTeamPicker from "@/components/league/MyTeamPicker";
import { InstallMenuItem } from "@/components/layout/InstallApp";

export type Page = { to: string; label: string; icon: LucideIcon };
type Section = { label: string; icon: LucideIcon; pages: Page[]; also?: string[] };

/** საიტის სტრუქტურა: 7 ჯგუფი, თითოში — გვერდები (ზედა ქვე-მენიუში ჩანს) */
export const SECTIONS: Section[] = [
  { label: "მთავარი", icon: Home, pages: [{ to: "/", label: "მთავარი", icon: Home }] },
  { label: "Live", icon: Radio, pages: [{ to: "/live", label: "Live", icon: Radio }] },
  {
    label: "სეზონი",
    icon: Table2,
    pages: [
      { to: "/standings", label: "ცხრილი", icon: Table2 },
      { to: "/stats", label: "სტატისტიკა", icon: Activity },
      { to: "/analytics", label: "ანალიტიკა", icon: BarChart3 },
      { to: "/draft-grades", label: "Draft Grades", icon: Medal },
      { to: "/recap", label: "კვირის რეპორტაჟი", icon: Clapperboard },
      { to: "/trades", label: "ტრეიდები", icon: ArrowLeftRight },
    ],
  },
  { label: "გუნდები", icon: Users, pages: [{ to: "/managers", label: "გუნდები", icon: Users }], also: ["/team/", "/player/"] },
  {
    label: "ისტორია",
    icon: BookOpen,
    pages: [
      { to: "/history", label: "ჩემპიონები", icon: BookOpen },
      { to: "/trophies", label: "ტროფეები", icon: Trophy },
      { to: "/records", label: "რეკორდები", icon: Medal },
      { to: "/seasons", label: "სეზონები", icon: CalendarRange },
      { to: "/h2h", label: "H2H", icon: Swords },
      { to: "/archive", label: "რეპორტაჟები", icon: Clapperboard },
    ],
  },
];
/** ყველა გვერდი ერთ სიაში (PageHeader-ის აიკონისთვის) */
export const ROUTES: Page[] = SECTIONS.flatMap((s) => s.pages);

const isActive = (to: string, path: string) => (to === "/" ? path === "/" : path.startsWith(to));
export const sectionOf = (path: string) =>
  SECTIONS.find((s) => s.pages.some((p) => isActive(p.to, path)) || s.also?.some((a) => path.startsWith(a)));

function Brand({ league }: { league: string }) {
  return (
    <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
      <img src="/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
      <span className="leading-none">
        <span className="block whitespace-nowrap text-[15px] font-semibold capitalize tracking-tight">{clean(league)}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">Fantasy NBA</span>
      </span>
    </NavLink>
  );
}

function SeasonPill({ season }: { season: string }) {
  if (!season) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-muted-foreground tabular">
      <span className="h-1.5 w-1.5 rounded-full bg-win" />
      {season}
    </span>
  );
}

/** ბმული ნავბარში: აქტიურს ქვემოთ თეთრი ხაზი აქვს (ჰედერის ქვედა კიდეზე) */
const linkCls = (active: boolean) =>
  cn(
    "relative flex h-full items-center gap-1.5 whitespace-nowrap px-3 text-sm transition-colors",
    active ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground",
  );

/** კომპიუტერის მენიუ */
function DesktopNav() {
  const { pathname } = useLocation();
  return (
    <nav className="hidden h-full items-stretch lg:flex">
      {SECTIONS.map((sec) => (
        <NavGroup key={sec.label} sec={sec} active={sectionOf(pathname) === sec} />
      ))}
    </nav>
  );
}

/** ჯგუფი ნავბარში: ერთი გვერდი — ბმული; რამდენიმე — ჩამოსაშლელი მენიუ (მაუსზე ან დაჭერით) */
function NavGroup({ sec, active }: { sec: Section; active: boolean }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  useEffect(() => setOpen(false), [pathname]);
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

  if (sec.pages.length === 1) {
    return (
      <NavLink to={sec.pages[0].to} end={sec.pages[0].to === "/"} className={linkCls(active)}>
        {sec.label === "Live" && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--red))]" />}
        {sec.label}
      </NavLink>
    );
  }

  const enter = () => {
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const leave = () => {
    timer.current = window.setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={ref} className="relative flex h-full" onMouseEnter={enter} onMouseLeave={leave}>
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)} className={linkCls(active)}>
        {sec.label}
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
          <div className="grid w-[26rem] grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] animate-in fade-in-0 slide-in-from-top-1">
            {sec.pages.map(({ to, label, icon: PIcon }) => (
              <NavLink
                key={to}
                to={to}
                role="menuitem"
                className={({ isActive: a }) =>
                  cn("flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors", a ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground")
                }
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06]">
                  <PIcon className="h-4 w-4" />
                </span>
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiteHeader({ league, season, data }: { league: string; season: string; data?: LeagueData }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { pathname } = useLocation();

  // ქვემოთ სქროლვისას ნავბარი იმალება, ზემოთ სქროლვისას ბრუნდება
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - lastY) < 6) return;
      setHidden(y > lastY && y > 120);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setHidden(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-zinc-950/95 pt-[env(safe-area-inset-top)] transition-[transform,border-color,box-shadow] duration-300 ease-out",
        scrolled ? "border-white/[0.08] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)]" : "border-transparent",
        hidden && !open && "-translate-y-full",
      )}
    >
      <div className="container flex h-14 items-center gap-6">
        <Brand league={league} />
        <DesktopNav />

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline-flex">
            <SeasonPill season={season} />
          </span>
          <MyTeamPicker data={data} />
          <NotificationBell data={data} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-white/10 bg-transparent lg:hidden" aria-label="მენიუ">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[300px] flex-col border-white/10 bg-zinc-950 p-0">
              <div className="flex items-center gap-3 border-b border-white/[0.08] p-5">
                <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl" />
                <div>
                  <SheetTitle className="capitalize">{clean(league)}</SheetTitle>
                  <SheetDescription>Fantasy NBA · {season}</SheetDescription>
                </div>
              </div>
              <nav className="flex-1 space-y-5 overflow-y-auto p-3">
                {SECTIONS.map((sec) => (
                  <div key={sec.label} className="space-y-0.5">
                    {sec.pages.length > 1 && <div className="px-3 pb-1 text-[11px] font-medium text-muted-foreground/70">{sec.label}</div>}
                    {sec.pages.map(({ to, label, icon: Icon }) => {
                      const active = isActive(to, pathname) || (sec.pages.length === 1 && sectionOf(pathname) === sec);
                      return (
                        <NavLink
                          key={to}
                          to={to}
                          end={to === "/"}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                            active ? "bg-white/[0.08] font-medium text-foreground" : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </nav>
              <div className="space-y-4 border-t border-white/[0.08] p-5">
                <InstallMenuItem />
                <div className="text-xs text-muted-foreground">მონაცემები: ESPN Fantasy · ახლდება ავტომატურად</div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
