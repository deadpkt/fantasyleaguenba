import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Radio } from "lucide-react";
import { useData } from "@/lib/league";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Countdown from "@/components/league/Countdown";
import { useNews } from "@/lib/useNews";
import { useApi } from "@/lib/useApi";
import type { AnnouncementsData } from "@/types";
import { ArticleCard } from "@/pages/News";
import { DateTile, isNew } from "@/components/league/announcement";
import { TeamAvatar } from "@/components/league/team";
import { SECTIONS } from "@/components/layout/SiteHeader";
import ThisSeason, { HeroWeek, useTicker } from "@/components/league/ThisSeason";
import Today from "@/components/league/Today";

/** "ყველა გვერდის" ბარათების ფერები (HSL) */
const QUICK_COLORS = ["var(--red)", "var(--blue)", "var(--win)", "var(--gold)", "25 95% 60%"];

/** სექციის სათაური: სათაური + აღწერა + (არასავალდებულო) ბმული */
function SectionTitle({ title, sub, to }: { title: ReactNode; sub: string; to?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
      {to && (
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to={to}>
            ყველა <ArrowRight />
          </Link>
        </Button>
      )}
    </div>
  );
}

/** ტელევიზიის სტილის მორბენალი ხაზი ლიგის ფაქტებით */
function Ticker({ items }: { items: string[] }) {
  if (!items.length) return null;
  const row = (hidden?: boolean) => (
    <div className="ticker-track flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden}>
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-10 whitespace-nowrap text-sm">
          <span>{t}</span>
          <span className="h-1 w-1 rounded-full bg-orange-400/70" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="ticker group relative flex items-stretch overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/80">
      <div className="z-10 flex shrink-0 items-center border-r border-white/[0.08] bg-zinc-950 px-3 text-[11px] font-semibold text-muted-foreground">
        ამბები
      </div>
      <div className="flex min-w-0 flex-1 py-2.5 [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
        {row()}
        {row(true)}
      </div>
    </div>
  );
}

/** ყველა გუნდის ლოგო ერთად: გადაფარვით, ტალღით; მაუსზე იშლება და სახელს აჩვენებს */
function TeamStack({ names }: { names: string[] }) {
  return (
    <Link
      to="/managers"
      className="group/stack inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-4 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex">
        {names.map((n, i) => (
          <div
            key={n}
            className="team-pop relative -ml-2.5 transition-[margin] duration-500 ease-out first:ml-0 group-hover/stack:-ml-0.5 group-hover/stack:first:ml-0"
            style={{ animationDelay: `${300 + i * 70}ms`, zIndex: names.length - i }}
          >
            <div className="team-wave group/t relative" style={{ animationDelay: `${1600 + i * 110}ms` }}>
              <div className="rounded-full ring-2 ring-black transition-transform duration-200 group-hover/t:-translate-y-1 group-hover/t:scale-110">
                <TeamAvatar name={n} size={32} badge={false} />
              </div>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-white/10 bg-zinc-900/95 px-2 py-0.5 text-[11px] text-white opacity-0 shadow-lg transition-all duration-200 group-hover/t:translate-y-0 group-hover/t:opacity-100">
                {clean(n)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs leading-tight text-muted-foreground">
        <div className="font-semibold text-foreground">{names.length} მენეჯერი</div>
        <span className="inline-flex items-center gap-1">
          ყველა გუნდი <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/stack:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** ბოლო განცხადებები — მიმაგრებული ზემოთ, მერე ახალი */
function RecentAnnouncements() {
  const { state } = useApi<AnnouncementsData>("/api/announcements", 60_000);
  if (state.status !== "ready" || !state.data.items.length) return null;
  const items = state.data.items;
  const featured = items.find((x) => x.pinned) ?? items[0];
  const rest = items.filter((x) => x !== featured).slice(0, 3);
  const tone3 = (x: typeof featured) => (x.pinned ? "gold" : x.auto ? "blue" : "red") as "gold" | "blue" | "red";
  const href = (x: typeof featured) => (x.id ? `/announcements?announcement=${x.id}` : "/announcements");
  const reactions = Object.entries(featured.reactions ?? {})
    .filter(([, n]) => n > 0)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 4);

  return (
    <section className="space-y-4">
      <SectionTitle
        to="/announcements"
        sub="კომისრისგან და ESPN-იდან"
        title="განცხადებები"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* მთავარი განცხადება */}
        <Link
          to={href(featured)}
          className={cn(
            "group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-zinc-950",
            rest.length ? "lg:col-span-3" : "lg:col-span-5",
          )}
        >
          {featured.image ? (
            <img
              src={featured.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
            />
          ) : null}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          <div className="relative space-y-3 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <DateTile a={featured} tone={tone3(featured)} big />
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {featured.pinned && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-medium text-amber-200">📌 მიმაგრებული</span>}
                {isNew(featured) && <span className="rounded-full bg-orange-500/20 px-2 py-0.5 font-medium text-orange-200">ახალი</span>}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/80">{featured.auto ? "ESPN" : "კომისარი"}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{featured.title}</h3>
            {featured.text && <p className="line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/75">{featured.text}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex gap-1.5">
                {reactions.map(([e, n]) => (
                  <span key={e} className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular backdrop-blur">
                    {e} {n}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-300 transition-transform duration-300 group-hover:translate-x-1">
                წაიკითხე <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>

        {/* დანარჩენები */}
        {rest.length > 0 && (
          <div className="flex flex-col gap-3 lg:col-span-2">
            {rest.map((x, i) => (
              <Link
                key={x.id ?? i}
                to={href(x)}
                className="pass-in group flex items-start gap-3 rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <DateTile a={x} tone={tone3(x)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {x.auto ? "ESPN" : "კომისარი"}
                    {isNew(x) && <span className="rounded-full bg-orange-500/20 px-1.5 text-orange-200">ახალი</span>}
                  </div>
                  <div className="truncate font-semibold">{x.title}</div>
                  {x.text && <p className="line-clamp-2 text-xs text-muted-foreground">{x.text}</p>}
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** 3 ბოლო NBA სიახლე */
function LatestNews() {
  const news = useNews();
  if (news.status !== "ready") return null;
  const { nba } = news.data;
  if (!nba.length) return null;
  return (
    <section className="space-y-4">
      <SectionTitle title="სიახლეები" sub="NBA · ESPN" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {nba.slice(0, 3).map((a) => (
          <ArticleCard key={a.headline} a={a} compact />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const data = useData();
  const { current } = data;
  const ticker = useTicker();

  return (
    <div className="space-y-14 pb-4">
      {/* ჰერო */}
      <section className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-[1.2fr_1fr] md:items-end md:pt-16">
        <div className="space-y-6">
          <div className="hero-in text-sm text-muted-foreground">Fantasy NBA · სეზონი {current.label}</div>
          <h1
            className="hero-title pb-1 text-[3.4rem] font-extrabold leading-[0.95] tracking-tighter sm:text-7xl md:text-8xl"
            style={{ animationDelay: "80ms" }}
          >
            {clean(data.league)}
          </h1>
          <p className="hero-in max-w-md text-base text-muted-foreground" style={{ animationDelay: "160ms" }}>
            ცხრილი, Live მატჩაფები, ისტორია და რეკორდები. ყველაფერი ESPN-იდან ახლდება.
          </p>
          <div className="hero-in flex flex-wrap items-center gap-x-6 gap-y-4" style={{ animationDelay: "240ms" }}>
            <div className="flex gap-2">
              <Button asChild className="shadow-[0_8px_30px_-8px_rgba(255,255,255,0.45)]">
                <Link to="/standings">
                  ცხრილი <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-white/[0.03] backdrop-blur">
                <Link to="/live">
                  <Radio /> Live
                </Link>
              </Button>
            </div>
            <TeamStack names={current.standings.map((t) => t.name)} />
          </div>
        </div>
        <div className="hero-in" style={{ animationDelay: "200ms" }}>
          {current.drafted ? <HeroWeek /> : <Countdown draft={current.draft} drafted={current.drafted} />}
        </div>
      </section>

      <Ticker items={ticker} />

      <ThisSeason />

      <Today />

      <RecentAnnouncements />

      <LatestNews />

      {/* ყველა გვერდი, ჯგუფებად */}
      <section className="space-y-4">
        <SectionTitle title="ყველა გვერდი" sub="სწრაფი გადასვლა" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.filter((sec) => sec.pages[0].to !== "/").map((sec, i) => {
            const Icon = sec.icon;
            const c = QUICK_COLORS[i % QUICK_COLORS.length];
            return (
              <div
                key={sec.label}
                className={cn(
                  "quick group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/90 p-4 transition-colors duration-200 hover:border-white/20",
                  sec.pages.length > 4 && "sm:col-span-2 lg:col-span-1 lg:row-span-2",
                )}
                style={{ ["--c" as string]: c }}
              >
                <Link to={sec.pages[0].to} className="relative mb-3 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-[hsl(var(--c))]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{sec.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{sec.pages.length > 1 ? `${sec.pages.length} გვერდი` : "გახსნა"}</span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
                {sec.pages.length > 1 && (
                  <div className="relative flex flex-wrap gap-1.5">
                    {sec.pages.map(({ to, label, icon: PIcon }) => (
                      <Link
                        key={to}
                        to={to}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
                      >
                        <PIcon className="h-3 w-3" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
