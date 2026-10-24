import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Ball } from "@/components/league/announcement";

/** "ზემოთ" ღილაკი (კომპიუტერზე; ტელეფონზე ქვედა მენიუა).
 *  state მხოლოდ მაშინ იცვლება, როცა ზღვარს გადავკვეთთ, ყოველ სქროლზე არა. */
export default function SiteFx() {
  const [showTop, setShowTop] = useState(false);
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 700);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <button
      type="button"
      aria-label="ზემოთ"
      onClick={() => {
        setSpin((n) => n + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={cn(
        "fixed bottom-5 right-5 z-40 hidden h-11 w-11 place-items-center rounded-full border border-white/15 bg-zinc-900 transition-[opacity,transform] duration-300 hover:border-white/30 md:grid",
        showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <Ball key={spin} className={cn("h-6 w-6", spin > 0 && "ball-spin")} />
    </button>
  );
}

/** გვერდის შეცვლისას: რბილი შემოსვლა */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
}
