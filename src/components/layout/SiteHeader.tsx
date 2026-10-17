import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  BookOpen,
  CalendarRange,
  ChevronDown,
  Home,
  Medal,
  Megaphone,
  Menu,
  Newspaper,
  Radio,
  ScrollText,
  Swords,
  Table2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clean } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Group = "ლიგა" | "სეზონი" | "ისტორია";
type Route = { to: string; label: string; icon: LucideIcon; group: Group; more?: boolean };

export const ROUTES: Route[] = [
  { to: "/", label: "მთავარი", icon: Home, group: "ლიგა" },
  { to: "/live", label: "Live", icon: Radio, group: "ლიგა" },
  { to: "/announcements", label: "განცხადებები", icon: Megaphone, group: "ლიგა" },
  { to: "/news", label: "სიახლეები", icon: Newspaper, group: "ლიგა" },
  { to: "/managers", label: "მენეჯერები", icon: Users, group: "სეზონი" },
  { to: "/standings", label: "ცხრილი", icon: Table2, group: "სეზონი" },
  { to: "/trades", label: "ტრეიდები", icon: ArrowLeftRight, group: "სეზონი" },
  { to: "/rules", label: "წესები", icon: ScrollText, group: "სეზონი", more: true },
  { to: "/history", label: "ისტორია", icon: BookOpen, group: "ისტორია", more: true },
  { to: "/records", label: "რეკორდები", icon: Medal, group: "ისტორია", more: true },
  { to: "/seasons", label: "სეზონები", icon: CalendarRange, group: "ისტორია", more: true },
  { to: "/h2h", label: "H2H", icon: Swords, group: "ისტორია", more: true },
];
const GROUPS: Group[] = ["ლიგა", "სეზონი", "ისტორია"];

const isActive = (to: string, path: string) => (to === "/" ? path === "/" : path.startsWith(to));

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

/** "მეტი ▾" — ნაკლებად ხშირად გამოყენებული გვერდები */
function MoreMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

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

  return (
    <div ref={ref} className="relative z-10" data-active={active}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-200",
          active ? "text-black" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
        )}
      >
        მეტი <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] w-52 rounded-xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95"
        >
          {ROUTES.filter((r) => r.more).map(({ to, label, icon: Icon }) => (
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
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
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
      {ROUTES.filter((r) => !r.more).map(({ to, label, icon: Icon }) => {
        const active = isActive(to, pathname);
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            data-active={active}
            className={cn(
              "relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-200",
              active ? "text-black" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </NavLink>
        );
      })}
      <MoreMenu active={ROUTES.some((r) => r.more && isActive(r.to, pathname))} />
    </nav>
  );
}

export default function SiteHeader({ league, season }: { league: string; season: string }) {
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

          {/* ტელეფონი / პლანშეტი */}
          <div className="ml-auto flex items-center gap-2 xl:hidden">
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
                <nav className="flex-1 space-y-5 overflow-y-auto p-3">
                  {GROUPS.map((g) => (
                    <div key={g} className="space-y-1">
                      <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">{g}</div>
                      {ROUTES.filter((r) => r.group === g).map(({ to, label, icon: Icon }) => {
                        const active = isActive(to, pathname);
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
