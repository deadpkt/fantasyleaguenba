import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  CalendarRange,
  ChevronDown,
  Clapperboard,
  Home,
  Medal,
  Megaphone,
  Menu,
  Radio,
  Percent,
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
      { to: "/odds", label: "შანსები", icon: Percent },
      { to: "/analytics", label: "ანალიტიკა", icon: BarChart3 },
      { to: "/draft-grades", label: "Draft Grades", icon: Medal },
      { to: "/recap", label: "კვირის რეპორტაჟი", icon: Clapperboard },
      { to: "/trades", label: "ტრეიდები", icon: ArrowLeftRight },
    ],
  },
  { label: "გუნდები", icon: Users, pages: [{ to: "/managers", label: "გუნდები", icon: Users }], also: ["/team/"] },
  {
    label: "ისტორია",
    icon: BookOpen,
    pages: [
      { to: "/history", label: "ჩემპიონები", icon: BookOpen },
      { to: "/trophies", label: "ტროფეები", icon: Trophy },
      { to: "/records", label: "რეკორდები", icon: Medal },
      { to: "/seasons", label: "სეზონები", icon: CalendarRange },
      { to: "/h2h", label: "H2H", icon: Swords },
    ],
  },
  { label: "განცხადებები", icon: Megaphone, pages: [{ to: "/announcements", label: "განცხადებები", icon: Megaphone }] },
];
/** ყველა გვერდი ერთ სიაში (PageHeader-ის აიკონისთვის) */
export const ROUTES: Page[] = SECTIONS.flatMap((s) => s.pages);

const isActive = (to: string, path: string) => (to === "/" ? path === "/" : path.startsWith(to));
export const sectionOf = (path: string) =>
  SECTIONS.find((s) => s.pages.some((p) => isActive(p.to, path)) || s.also?.some((a) => path.startsWith(a)));

function Brand({ league }: { league: string }) {
  return (
    <NavLink to="/" className="group flex shrink-0 items-center gap-2.5">
      <img
        src="/icon.png"
        alt=""
        className="h-8 w-8 rounded-lg ring-1 ring-white/15 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
      />
      <span className="leading-none">
        <span className="block whitespace-nowrap text-sm font-semibold capitalize tracking-tight">{clean(league)}</span>
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

/** კომპიუტერის მენიუ: თეთრი "აბრა" რბილად გადადის აქტიურ ბმულზე */
function DesktopNav() {
  const { pathname } = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const el = nav.querySelector<HTMLElement>('[data-active="true"]');
      setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [pathname]);

  return (
    <nav ref={navRef} className="relative mx-auto hidden items-center gap-0.5 rounded-xl bg-white/[0.03] p-1 ring-1 ring-inset ring-white/[0.04] xl:flex">
      {pill && (
        <span
          aria-hidden="true"
          className="absolute top-1 h-[calc(100%-0.5rem)] rounded-lg bg-white shadow-[0_2px_12px_rgba(255,255,255,0.18)] transition-all duration-300 ease-[cubic-bezier(.3,1.3,.5,1)] motion-reduce:transition-none"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
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
  const Icon = sec.icon;
  const cls = cn(
    "relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition-colors duration-200",
    active ? "text-black" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
  );

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
      <div data-active={active} className="relative z-10">
        <NavLink to={sec.pages[0].to} end={sec.pages[0].to === "/"} className={cls}>
          <Icon className="h-3.5 w-3.5" />
          {sec.label}
        </NavLink>
      </div>
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
    <div ref={ref} data-active={active} className="relative z-10" onMouseEnter={enter} onMouseLeave={leave}>
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)} className={cls}>
        <Icon className="h-3.5 w-3.5" />
        {sec.label}
        <ChevronDown className={cn("h-3 w-3 opacity-60 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2.5">
          <div className="w-56 rounded-xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-1">
            {sec.pages.map(({ to, label, icon: PIcon }) => (
              <NavLink
                key={to}
                to={to}
                role="menuitem"
                className={({ isActive: a }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    a ? "bg-white text-black" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                  )
                }
              >
                <PIcon className="h-4 w-4" />
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
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 w-full transition-[padding] duration-300", scrolled ? "pt-2" : "pt-3")}>
      <div className="container">
        <div
          className={cn(
            "relative flex items-center gap-3 rounded-2xl border px-3 backdrop-blur-xl transition-all duration-300",
            scrolled
              ? "h-12 border-white/[0.12] bg-zinc-950/85 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.95)]"
              : "h-14 border-white/10 bg-zinc-950/60 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.9)]",
          )}
        >
          {/* თხელი ფერადი ხაზი ქვემოთ */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 -bottom-px h-px bg-gradient-to-r from-transparent via-[hsl(var(--red)/0.6)] to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1/4 -bottom-px h-px bg-gradient-to-r from-[hsl(var(--gold)/0.0)] via-[hsl(var(--blue)/0.7)] to-[hsl(var(--gold)/0.0)]"
          />

          <Brand league={league} />
          <DesktopNav />

          <div className="ml-auto hidden 2xl:block">
            <SeasonPill season={season} />
          </div>
          <div className="hidden xl:block"><NotificationBell data={data} /></div>

          {/* ტელეფონი / პლანშეტი */}
          <div className="ml-auto flex items-center gap-2 xl:hidden">
            <NotificationBell data={data} />
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
                <div className="relative flex items-center gap-3 border-b border-white/10 p-5">
                  <img src="/icon.png" alt="" className="h-10 w-10 rounded-xl ring-1 ring-white/15" />
                  <div>
                    <SheetTitle className="capitalize">{clean(league)}</SheetTitle>
                    <SheetDescription>Fantasy NBA · {season}</SheetDescription>
                  </div>
                  <span className="absolute inset-x-5 -bottom-px h-px bg-gradient-to-r from-[hsl(var(--red)/0.6)] via-[hsl(var(--gold)/0.5)] to-[hsl(var(--blue)/0.6)]" />
                </div>
                <nav className="flex-1 space-y-4 overflow-y-auto p-3">
                  {SECTIONS.map((sec) => (
                    <div key={sec.label} className="space-y-1">
                      {sec.pages.length > 1 && (
                        <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">{sec.label}</div>
                      )}
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
                              active ? "bg-white text-black" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                active ? "bg-black/10" : "bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]",
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            {label}
                          </NavLink>
                        );
                      })}
                    </div>
                  ))}
                </nav>
                <div className="border-t border-white/10 p-5 text-xs text-muted-foreground">მონაცემები: ESPN Fantasy · ახლდება ავტომატურად</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
