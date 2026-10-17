import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/components/layout/SiteHeader";

/** გვერდის სათაური: გვერდის აიკონი, სათაური, ახსნა, მარჯვნივ მოქმედებები */
export default function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  const { pathname } = useLocation();
  const Icon = ROUTES.find((r) => r.to !== "/" && pathname.startsWith(r.to))?.icon;

  return (
    <div className="relative mb-2 flex flex-col gap-4 pb-8 pt-8 sm:flex-row sm:items-end sm:justify-between md:pt-12">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="hero-in grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-orange-400/25 bg-gradient-to-b from-orange-400/15 to-orange-500/[0.03] text-orange-300 shadow-[0_10px_30px_-12px_rgba(249,115,22,0.7)]">
            <Icon className="h-[22px] w-[22px]" />
          </div>
        )}
        <div className="space-y-1.5">
          <h1 className="hero-in page-title text-3xl font-bold tracking-tight md:text-4xl" style={{ animationDelay: "60ms" }}>
            {title}
          </h1>
          {description && (
            <p className="hero-in max-w-2xl text-sm text-muted-foreground" style={{ animationDelay: "120ms" }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="hero-in" style={{ animationDelay: "160ms" }}>
          {children}
        </div>
      )}
      <div className="head-line absolute inset-x-0 bottom-3 h-px bg-gradient-to-r from-orange-400/50 via-white/10 to-transparent" />
    </div>
  );
}
