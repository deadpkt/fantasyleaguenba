import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Ball } from "@/components/league/announcement";

/** მთელი საიტის ეფექტები:
 *  - ბარათები ჩნდება სქროლისას (.reveal → .shown)
 *  - ბარათზე მაუსის "პროჟექტორი" (.spot, --mx / --my)
 *  - სქროლის პროგრესის ზოლი და "ზემოთ" ღილაკი */
export default function SiteFx() {
  const { pathname } = useLocation();
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [spin, setSpin] = useState(0);

  // გამოჩენა სქროლისას — ერთად შემოსულ ბარათებს მცირე დაგვიანება აქვს
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.animationDelay = `${Math.min(i++, 6) * 70}ms`;
          el.classList.add("shown");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    const scan = () => document.querySelectorAll(".reveal:not(.shown)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  // პროჟექტორი
  useEffect(() => {
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = (e.target as Element | null)?.closest?.(".spot") as HTMLElement | null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);

  // სქროლი
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        setShowTop(window.scrollY > 700);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [pathname]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-orange-500 via-amber-300 to-[hsl(var(--red))]"
        style={{ transform: `scaleX(${progress})` }}
      />
      <button
        type="button"
        aria-label="ზემოთ"
        onClick={() => {
          setSpin((n) => n + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className={cn(
          "fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-zinc-900/70 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/50",
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <Ball key={spin} className={cn("h-6 w-6", spin > 0 && "ball-spin")} />
      </button>
    </>
  );
}

/** გვერდის შეცვლისას — რბილი შემოსვლა */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
}
