import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ROUTES, sectionOf } from "@/components/layout/SiteHeader";

/** გვერდის სათაური: გვერდის ხატულა, გზა (ჯგუფი / გვერდი), სათაური, ახსნა, მარჯვნივ მოქმედებები.
 *  "სტატისტიკა · 2026-27" → სათაური "სტატისტიკა" და გვერდით აბრა "2026-27". */
export default function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  const { pathname } = useLocation();
  const page = ROUTES.find((r) => r.to !== "/" && pathname.startsWith(r.to));
  const sec = sectionOf(pathname);
  const Icon = page?.icon ?? sec?.icon;
  const [main, badge] = title.split(" · ");

  return (
    <header className="mb-8 pt-8 md:pt-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <span className="hero-in mt-1 hidden h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.02] sm:grid">
              <Icon className="h-6 w-6 text-foreground/90" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0 space-y-2">
            {sec && (
              <nav aria-label="გზა" className="hero-in flex items-center gap-1 text-xs text-muted-foreground">
                <Link to={sec.pages[0].to} className="transition-colors hover:text-foreground">
                  {sec.label}
                </Link>
                {page && sec.pages.length > 1 && (
                  <>
                    <ChevronRight className="h-3 w-3 text-white/25" />
                    <span className="text-foreground/80">{page.label}</span>
                  </>
                )}
              </nav>
            )}
            <h1 className="hero-in page-title flex flex-wrap items-center gap-x-3 gap-y-2 text-[2rem] font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
              <span className="min-w-0 break-words">{main}</span>
              {badge && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm font-medium text-muted-foreground tabular">
                  <span className="h-1.5 w-1.5 rounded-full bg-win" />
                  {badge}
                </span>
              )}
            </h1>
            {description && <p className="hero-in max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
          </div>
        </div>
        {children && <div className="hero-in shrink-0">{children}</div>}
      </div>
      <div className="relative mt-7 h-px bg-white/[0.08]">
        <span className="absolute left-0 top-0 h-px w-20 bg-gradient-to-r from-white/70 to-transparent" />
      </div>
    </header>
  );
}
