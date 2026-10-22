import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { sectionOf } from "@/components/layout/SiteHeader";

/** ჯგუფის გვერდები ზემოთ, პატარა ჩანართებად (მაგ. ისტორია: ჩემპიონები · ტროფეები · რეკორდები…) */
export default function SubNav() {
  const { pathname } = useLocation();
  const sec = sectionOf(pathname);
  if (!sec || sec.pages.length < 2) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4 pt-6 [scrollbar-width:none] md:pt-8 [&::-webkit-scrollbar]:hidden">
      <nav className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md">
        {sec.pages.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition-all duration-200",
                isActive
                  ? "bg-white/[0.1] text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
              )
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
