import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SECTIONS, sectionOf } from "@/components/layout/SiteHeader";

/** ტელეფონზე ქვედა მენიუ, როგორც აპებში: 5 მთავარი ჯგუფი. განცხადებები ზედა მენიუში და ზარშია. */
const TABS = SECTIONS.filter((s) => s.label !== "განცხადებები");

export default function BottomNav() {
  const { pathname } = useLocation();
  const current = sectionOf(pathname);
  return (
    <nav
      aria-label="მთავარი მენიუ"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-zinc-950 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid h-[4.25rem]" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
        {TABS.map((s) => {
          const on = current === s;
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.pages[0].to}
              aria-current={on ? "page" : undefined}
              className={cn("flex flex-col items-center justify-center gap-1 text-[10px] transition-colors", on ? "text-foreground" : "text-muted-foreground")}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", on && "bg-white/[0.1]")}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={on ? 2.2 : 1.8} />
              </span>
              {s.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
