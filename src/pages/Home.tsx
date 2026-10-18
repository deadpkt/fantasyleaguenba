import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Dices,
  Flame,
  Radio,
  TrendingUp,
} from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt, plain, signedPct } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Countdown from "@/components/league/Countdown";
import { useNews } from "@/lib/useNews";
import { useApi } from "@/lib/useApi";
import type { AnnouncementsData } from "@/types";
import { ArticleCard } from "@/pages/News";
import { AnnouncementCard, Ball } from "@/components/league/announcement";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import { SECTIONS } from "@/components/layout/SiteHeader";
import { CountText, CountUp } from "@/components/league/CountUp";

function Trophy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="trophy-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset=".5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <path
        fill="url(#trophy-g)"
        d="M62 30h76v14h26c0 34-14 52-36 56-6 14-16 22-28 25v20h22v14H78v-14h22v-20c-12-3-22-11-28-25-22-4-36-22-36-56h26zm-12 28c2 16 8 26 16 30-3-9-4-19-4-30zm100 0h-12c0 11-1 21-4 30 8-4 14-14 16-30z"
      />
      <circle cx="100" cy="66" r="17" fill="#ea580c" />
      <path d="M83 66h34M100 49v34" stroke="#431407" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/** მინი სვეტოვანი გრაფიკი — გუნდის ყოველი კვირა, რეკორდული გამოკვეთილია */
function Bars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const hi = values.indexOf(max);
  return (
    <div className="flex h-14 items-end gap-[3px]" aria-hidden="true">
      {values.map((v, i) => (
        <div
          key={i}
          className={cn(
            "bar-grow flex-1 origin-bottom rounded-t-sm",
            i === hi ? "bg-[hsl(var(--blue))] shadow-[0_0_12px_hsl(var(--blue)/0.6)]" : "bg-[hsl(var(--blue)/0.25)]",
          )}
          style={{ height: `${15 + ((v - min) / Math.max(1, max - min)) * 85}%`, animationDelay: `${200 + i * 35}ms` }}
        />
      ))}
    </div>
  );
}

function ChampStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-400/15 bg-gradient-to-b from-amber-400/[0.07] to-transparent px-3.5 py-2.5 backdrop-blur-sm transition-colors duration-300 group-hover:border-amber-400/25">
      <div className="text-[11px] font-medium uppercase tracking-wider text-amber-200/60">{label}</div>
      <div className="mt-0.5 text-xl font-bold tabular sm:text-2xl">{value}</div>
    </div>
  );
}

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
    <div className="ticker group relative flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
      <div className="z-10 flex shrink-0 items-center gap-2 bg-[hsl(var(--red))] px-3 font-mono text-[11px] font-bold tracking-widest text-white shadow-[8px_0_20px_rgba(0,0,0,0.6)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        WCF
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
  const { state } = useApi<AnnouncementsData>("/api/announcements");
  if (state.status !== "ready" || !state.data.items.length) return null;
  const items = state.data.items.slice(0, 3);
  return (
    <section className="space-y-4">
      <SectionTitle
        to="/announcements"
        sub="ლიგის ახალი ამბები"
        title={
          <>
            <Ball className="h-6 w-6 transition-transform duration-700 hover:rotate-[360deg]" /> განცხადებები
          </>
        }
      />
      <div className={cn("grid grid-cols-1 gap-3", items.length > 1 && "md:grid-cols-2", items.length > 2 && "lg:grid-cols-3")}>
        {items.map((a, i) => (
          <AnnouncementCard key={a.id ?? i} a={a} index={i} compact />
        ))}
      </div>
    </section>
  );
}

type Fact = { icon: string; label: string; text: ReactNode };

/** ფაქტები ლიგის ისტორიიდან — All-Time, H2H და რეკორდები */
function useFacts(): Fact[] {
  const data = useData();
  const b = (x: ReactNode) => <span className="font-semibold text-foreground">{x}</span>;
  const out: Fact[] = [];
  const at = data.alltime.filter((r) => r.seasons > 0);
  const top = <K extends keyof (typeof at)[number]>(k: K) => [...at].sort((x, y) => Number(y[k]) - Number(x[k]))[0];

  const titles = top("titles");
  if (titles?.titles) out.push({ icon: "🏆", label: "დინასტია", text: <>{b(clean(titles.team))} ლიგაში ყველაზე მეტი ტიტული აქვს: {b(titles.titles)} ({titles.titles_y.join(", ")}).</> });
  const pct = top("pct");
  if (pct) out.push({ icon: "📊", label: "All-Time", text: <>ყველა დროის საუკეთესო მოგების % {b(clean(pct.team))}-ს აქვს: {b(`${(pct.pct * 100).toFixed(1)}%`)} ({pct.w}-{pct.l}).</> });
  const ppg = top("ppg");
  if (ppg) out.push({ icon: "🔥", label: "შეტევა", text: <>{b(clean(ppg.team))} საშუალოდ {b(fmt(Math.round(ppg.ppg)))} ქულას აგროვებს კვირაში. ლიგაში ყველაზე მეტს.</> });
  const po = top("playoffs");
  if (po?.playoffs) out.push({ icon: "🎟️", label: "პლეიოფი", text: <>{b(clean(po.team))} პლეიოფში {b(po.playoffs)}-ჯერ მოხვდა {po.seasons} სეზონიდან.</> });

  // H2H: ყველაზე ცალმხრივი და ყველაზე ხშირი დაპირისპირება
  const { teams, cells } = data.h2h;
  type Pair = [number, number, number, number];
  let lop: Pair | null = null;
  let most: Pair | null = null;
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      const [w, l] = cells[i][j];
      if (i === j || w + l < 3) continue;
      if (!lop || w - l > lop[2] - lop[3]) lop = [i, j, w, l];
      if (i < j && (!most || w + l > most[2] + most[3])) most = [i, j, w, l];
    }
  }
  if (lop) {
    const [i, j, w, l] = lop;
    out.push({ icon: "😤", label: "ბატონი და მსახური", text: <>{b(clean(teams[i]))} {b(clean(teams[j]))}-ს ფლობს: H2H-ში {b(`${w}-${l}`)}.</> });
  }
  if (most) {
    const [i, j, w, l] = most;
    out.push({ icon: "⚔️", label: "მთავარი დაპირისპირება", text: <>{b(clean(teams[i]))} და {b(clean(teams[j]))} {b(w + l)}-ჯერ შეხვდნენ, ანგარიში {w}-{l}.</> });
  }
  for (const r of data.records.slice(0, 4)) out.push({ icon: "📌", label: "რეკორდი", text: <>{r.k}: {b(r.v)}, {clean(r.who)}{r.when ? ` (${r.when})` : ""}.</> });
  return out;
}

const FACT_MS = 7000;

/** "იცოდი?" — ფაქტები თავისით იცვლება, მაუსზე ჩერდება */
function DidYouKnow() {
  const facts = useFacts();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || facts.length < 2) return;
    const id = window.setTimeout(() => setI((x) => (x + 1) % facts.length), FACT_MS);
    return () => window.clearTimeout(id);
  }, [i, paused, facts.length]);
  if (!facts.length) return null;
  const f = facts[i % facts.length];
  const go = (d: number) => setI((x) => (x + d + facts.length) % facts.length);

  return (
    <section className="space-y-4">
      <SectionTitle title="იცოდი?" sub="ლიგის ისტორიიდან" />
      <Card className="tone-card overflow-hidden" style={tone("blue")} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="flex items-center gap-4 p-5 sm:gap-6 sm:p-7">
          <div key={`i${i}`} className="fact-in grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl sm:h-16 sm:w-16 sm:text-4xl">
            {f.icon}
          </div>
          <div key={`t${i}`} className="fact-in min-w-0 flex-1 space-y-1" style={{ animationDelay: "60ms" }}>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--blue))]">{f.label}</div>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{f.text}</p>
          </div>
          <div className="hidden shrink-0 gap-1 sm:flex">
            <Button variant="ghost" size="icon" aria-label="წინა" onClick={() => go(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" aria-label="შემდეგი" onClick={() => go(1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-5 pb-4 sm:px-7">
          {facts.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`ფაქტი ${k + 1}`}
              onClick={() => setI(k)}
              className={cn("relative h-1 overflow-hidden rounded-full bg-white/10 transition-all duration-300", k === i % facts.length ? "w-10" : "w-3 hover:bg-white/25")}
            >
              {k === i % facts.length && (
                <span
                  key={i}
                  className="fact-bar absolute inset-0 origin-left bg-[hsl(var(--blue))]"
                  style={{ animationDuration: `${FACT_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                />
              )}
            </button>
          ))}
        </div>
      </Card>
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
      <SectionTitle title="სიახლეები" sub="NBA · ESPN" to="/news" />
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
  const champ = data.champions[data.champions.length - 1];
  const last = data.seasons.find((s) => s.complete);
  const champRow = last?.standings.find((t) => t.final === 1);
  const streak = data.records.find((r) => r.k.includes("მოგებების"));
  const high = data.records.find((r) => r.k.includes("მაღალი"));
  const mvp = last?.awards.mvp;
  const steal = last?.draft?.steals[0];
  const lucky = last?.luck[0];
  const recTeam = high && last?.weekly.teams.find((t) => plain(t.name) === plain(high.who));
  const recScores = recTeam ? recTeam.scores.map((x) => (x ? x[0] : 0)) : [];
  const trades = data.trades?.past?.[0];
  const ticker = [
    champ && `🏆 მოქმედი ჩემპიონი: ${clean(champ.team)} (${champ.rec})`,
    mvp && `⭐ ${last?.label} MVP: ${mvp.player} · ${fmt(mvp.total)} FP`,
    high && `🔥 რეკორდული კვირა: ${high.v} · ${clean(high.who)}`,
    steal && `📈 დრაფტის Steal: ${steal.player}: #${steal.n} → #${steal.rank}`,
    lucky && `🍀 ყველაზე იღბლიანი: ${clean(lucky.name)} ${signedPct(lucky.luck)}`,
    trades && `🔁 ${trades.season}: ${trades.total} ტრეიდი`,
    streak && `⚡ ${streak.k}: ${streak.v} · ${clean(streak.who)}`,
    `🏀 ${current.standings.length} გუნდი · ${data.champions.length} ჩემპიონი ისტორიაში`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-14 pb-4">
      {/* ჰერო */}
      <section className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-[1.2fr_1fr] md:items-end md:pt-16">
        <div className="space-y-6">
          <div className="hero-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-3 backdrop-blur-md">
            <span className="rounded-full bg-gradient-to-r from-[hsl(var(--red))] to-[hsl(var(--blue))] px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-white">
              NBA
            </span>
            <span className="text-xs font-medium tracking-wide text-muted-foreground">Fantasy · სეზონი {current.label}</span>
          </div>
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
          <Countdown draft={current.draft} drafted={current.drafted} />
        </div>
      </section>

      <Ticker items={ticker} />

      <RecentAnnouncements />

      {/* Storylines */}
      <section className="space-y-4">
        <SectionTitle title="Storylines" sub="სეზონის დაწყებამდე" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {champ && (
            <Card className="champ-card tone-card lift group md:col-span-4 md:row-span-2" style={tone("gold")}>
              {/* ფონი: ოქროსფერი ნათება + თხელი ბადე */}
              <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl" />
              <div className="champ-grid pointer-events-none absolute inset-0" />
              <span className="champ-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3" />

              <div className="pointer-events-none absolute -right-4 top-3 sm:right-4 sm:top-6">
                <div className="absolute inset-x-6 bottom-2 h-6 rounded-full bg-amber-500/40 blur-xl" />
                <Trophy className="trophy-float relative h-28 w-28 opacity-30 sm:h-44 sm:w-44 sm:opacity-95" />
              </div>

              <CardHeader className="relative">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                  <Crown className="h-3.5 w-3.5 text-gold" /> მოქმედი ჩემპიონი · {champ.season}
                </span>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="champ-ring relative shrink-0 rounded-2xl p-[2px]">
                    <div className="rounded-[14px] bg-black p-0.5">
                      <TeamAvatar name={champ.team} size={76} className="[&>img:first-child]:rounded-xl [&>span:first-child]:rounded-xl" />
                    </div>
                  </div>
                  <div className="min-w-0 sm:pr-44">
                    <div className="champ-name break-words text-3xl font-extrabold tracking-tight sm:truncate sm:text-5xl">{clean(champ.team)}</div>
                    {champ.runner && (
                      <div className="mt-1.5 text-sm text-muted-foreground">
                        ფინალში დაამარცხა <span className="text-foreground/80">{clean(champ.runner)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <ChampStat label="რეკორდი" value={champ.rec} />
                  {champRow && <ChampStat label="ქულა სეზონში" value={<CountUp value={champRow.pf} />} />}
                  {streak && plain(streak.who) === plain(champ.team) && <ChampStat label="მოგება ზედიზედ" value={<CountText text={streak.v} />} />}
                </div>
                <p className="flex items-center gap-2 text-sm text-amber-100/70">
                  <span className="h-px w-6 bg-gradient-to-r from-amber-400 to-transparent" />
                  მოქმედი ჩემპიონი. {current.label}-ში ყველა მის დამარცხებას ეცდება.
                </p>
              </CardContent>
            </Card>
          )}

          {mvp && (
            <Card className="tone-card lift flex flex-col md:col-span-2 md:row-span-2" style={tone("red")}>
              <div className="relative h-48 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_100%,hsl(var(--red)/0.35),transparent_70%)]" />
                <PlayerPhoto pid={mvp.pid} className="relative mx-auto h-full w-auto object-contain" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription>სეზონის MVP · {last?.label}</CardDescription>
                <CardTitle className="text-2xl">{mvp.player}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="text-4xl font-bold tabular text-[hsl(var(--red))]">
                  <CountUp value={mvp.total} /> <span className="text-sm font-normal text-muted-foreground">FP</span>
                </div>
                <div className="text-sm text-muted-foreground">{mvp.avg} ქულა თამაშში</div>
              </CardContent>
            </Card>
          )}

          {high && (
            <Card className="tone-card lift md:col-span-2" style={tone("blue")}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[hsl(var(--blue))]" /> რეკორდული კვირა
                </CardDescription>
                <CardTitle className="text-4xl tabular text-[hsl(var(--blue))]">
                  <CountText text={high.v} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <TeamAvatar name={high.who} size={22} badge={false} />
                  <span className="font-medium">{clean(high.who)}</span>
                  <span className="truncate text-muted-foreground">· {high.when}</span>
                </div>
                {recScores.length > 0 && <Bars values={recScores} />}
              </CardContent>
            </Card>
          )}

          {steal && (
            <Card className="tone-card lift md:col-span-2" style={tone("win")}>
              <PlayerPhoto
                pid={steal.pid}
                className="pointer-events-none absolute -right-3 top-0 h-28 w-36 opacity-80 [mask-image:linear-gradient(200deg,#000_40%,transparent_85%)]"
              />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-win" /> დრაფტის Steal
                </CardDescription>
                <CardTitle className="pr-20 text-xl">{steal.player}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 text-3xl font-bold tabular">
                  <span className="text-muted-foreground line-through decoration-2">#{steal.n}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-muted-foreground/50 to-[hsl(var(--win))]" />
                  <span className="text-win">#{steal.rank}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  +{steal.n - steal.rank} ადგილი · {clean(steal.team)}
                </div>
              </CardContent>
            </Card>
          )}

          {lucky && (
            <Card className="tone-card lift md:col-span-2" style={tone("gold")}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Dices className="h-4 w-4 text-gold" /> ყველაზე იღბლიანი
                </CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TeamAvatar name={lucky.name} size={24} badge={false} />
                  <span className="truncate">{clean(lucky.name)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold tabular text-gold">
                  <CountUp value={lucky.luck * 100} decimals={1} prefix={lucky.luck >= 0 ? "+" : ""} suffix="%" />
                </div>
                {(
                  [
                    ["რეალური", lucky.real, "bg-gold"],
                    ["All-play", lucky.allplay, "bg-muted-foreground/50"],
                  ] as const
                ).map(([l, v, c]) => (
                  <div key={l} className="grid grid-cols-[64px_1fr_36px] items-center gap-2 text-xs text-muted-foreground">
                    <span>{l}</span>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className={`bar-fill h-full origin-left rounded-full ${c}`} style={{ width: `${v * 100}%` }} />
                    </div>
                    <span className="text-right tabular text-foreground">{Math.round(v * 100)}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <DidYouKnow />

      <LatestNews />

      {/* ყველა გვერდი, ჯგუფებად */}
      <section className="space-y-4">
        <SectionTitle title="ყველა გვერდი" sub="სწრაფი გადასვლა" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.filter((sec) => sec.pages.length > 1).map((sec) => {
            const Icon = sec.icon;
            return (
              <Card key={sec.label} className="p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-orange-400/25 bg-orange-400/10 text-orange-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  {sec.label}
                </div>
                <div className="space-y-0.5">
                  {sec.pages.map(({ to, label, icon: PIcon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                    >
                      <PIcon className="h-3.5 w-3.5" />
                      <span className="flex-1">{label}</span>
                      <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

    </div>
  );
}
