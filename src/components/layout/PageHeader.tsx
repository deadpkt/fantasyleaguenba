import type { ReactNode } from "react";

/** გვერდის სათაური — shadcn-ის სტილში: სათაური, ახსნა, მარჯვნივ მოქმედებები */
export default function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 pb-6 pt-8 sm:flex-row sm:items-end sm:justify-between md:pt-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
