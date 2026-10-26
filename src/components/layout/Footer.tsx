import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { clean } from "@/lib/format";
import { SECTIONS } from "@/components/layout/SiteHeader";
import Updated from "@/components/league/Updated";

/** ბმულების სვეტები: ჯგუფები რამდენიმე გვერდით + ერთ-გვერდიანები ერთად (ტელეფონზე ქვედა მენიუა, ამიტომ მხოლოდ დიდ ეკრანზე) */
const COLUMNS: { title: string; links: { to: string; label: string }[] }[] = [
  { title: "საიტი", links: SECTIONS.filter((s) => s.pages.length === 1).map((s) => ({ to: s.pages[0].to, label: s.label })) },
  ...SECTIONS.filter((s) => s.pages.length > 1).map((s) => ({ title: s.label, links: s.pages.map((p) => ({ to: p.to, label: p.label })) })),
];

export default function Footer({ league, season, updatedAt }: { league: string; season: string; updatedAt?: string }) {
  return (
    <footer className="relative z-10 mt-20 border-t border-white/[0.08] bg-background">
      <div className="container grid grid-cols-2 gap-x-6 gap-y-8 py-8 md:grid-cols-[1.4fr_repeat(3,1fr)] md:py-10">
        <div className="col-span-2 space-y-3 md:col-span-1">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl border border-white/10" />
            <span>
              <span className="block font-semibold capitalize">{clean(league)}</span>
              <span className="block text-xs text-muted-foreground">Fantasy NBA · {season}</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">ლიგის საიტი: ლაივ ანგარიში, ცხრილი, გუნდები, ტრეიდები და მთელი ისტორია. ყველაფერი ESPN-იდან.</p>
          <Updated at={updatedAt} />
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title} className="hidden space-y-3 md:block">
            <div className="text-xs font-medium text-foreground/80">{c.title}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="container flex items-center justify-between gap-4 py-4 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {clean(league)}
            <span className="hidden sm:inline"> · მონაცემები: ESPN Fantasy Basketball</span>
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 transition-colors hover:border-white/25 hover:text-foreground"
          >
            <ArrowUp className="h-3.5 w-3.5" /> ზემოთ
          </button>
        </div>
      </div>
    </footer>
  );
}
