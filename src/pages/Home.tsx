import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Radio } from "lucide-react";
import { useData } from "@/lib/league";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Countdown from "@/components/league/Countdown";
import { useNews } from "@/lib/useNews";
import { ArticleCard } from "@/pages/News";
import { TeamAvatar } from "@/components/league/team";
import { SECTIONS } from "@/components/layout/SiteHeader";
import ThisSeason, { HeroWeek, MyMatch, useTicker } from "@/components/league/ThisSeason";
import { useMyTeam } from "@/lib/myTeam";
import { TeamChoices } from "@/components/league/MyTeamPicker";
import Today from "@/components/league/Today";
import LiveStrip from "@/components/league/LiveStrip";

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
      className="group/stack inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-4 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]"
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
  const myTid = useMyTeam();

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
              <Button asChild className="rounded-full">
                <Link to="/standings">
                  ცხრილი <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full bg-transparent">
                <Link to="/live">
                  <Radio /> Live
                </Link>
              </Button>
            </div>
            <TeamStack names={current.standings.map((t) => t.name)} />
          </div>
        </div>
        <div className="hero-in" style={{ animationDelay: "200ms" }}>
          {!current.drafted ? <Countdown draft={current.draft} drafted={current.drafted} /> : myTid != null ? <MyMatch tid={myTid} /> : <HeroWeek />}
        </div>
      </section>

      <div className="space-y-5">
        <LiveStrip />
        <Ticker items={ticker} />
      </div>

      {/* ჯერ არ აურჩევია: მოკლე შეთავაზება */}
      {myTid == null && current.drafted && (
        <section className="space-y-3 rounded-2xl border border-white/[0.08] bg-card p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold">აირჩიე შენი გუნდი</h2>
            <p className="text-sm text-muted-foreground">საიტი შენზე აეწყობა: შენი მატჩი პირველი, შენი გუნდი გამოყოფილი, შეტყობინებებში ფილტრი "ჩემი". შეცვლა ნებისმიერ დროს შეგიძლია ზემოთ.</p>
          </div>
          <TeamChoices data={data} />
        </section>
      )}

      <ThisSeason />

      <Today />


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
