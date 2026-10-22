import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES, sectionOf } from "@/components/layout/SiteHeader";

/** გვერდის სათაური: გზა (ჯგუფი / გვერდი), სათაური, ახსნა, მარჯვნივ მოქმედებები. */
export default function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  const { pathname } = useLocation();
  const page = ROUTES.find((r) => r.to !== "/" && pathname.startsWith(r.to));
  const sec = sectionOf(pathname);

  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-white/[0.08] pb-6 pt-8 sm:flex-row sm:items-end sm:justify-between md:pt-12">
      <div className="space-y-2">
        {sec && (
          <nav aria-label="გზა" className="hero-in flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to={sec.pages[0].to} className="transition-colors hover:text-foreground">
              {sec.label}
            </Link>
            {page && sec.pages.length > 1 && (
              <>
                <span className="text-white/20">/</span>
                <span className="text-foreground/70">{page.label}</span>
              </>
            )}
          </nav>
        )}
        <h1 className="hero-in page-title text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="hero-in max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="hero-in shrink-0">{children}</div>}
    </div>
  );
}
