import { useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeftRight, Award, CalendarRange, Crown, Lock, Shirt, Swords, Target, TrendingUp } from "lucide-react";
import { useData } from "@/lib/league";
import { useApi } from "@/lib/useApi";
import { clean, plain } from "@/lib/format";
import { espnImage } from "@/lib/logos";
import { NBA, nbaLogo } from "@/lib/nba";
import { cn } from "@/lib/utils";
import { achievements, type Achievement } from "@/lib/badges";
import { LORE, type Lore } from "@/data/lore";
import Connections from "@/components/league/Connections";
import type { Manager, PickemData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";
import { CountUp } from "@/components/league/CountUp";

const same = (a: string, b: string) => plain(a) === plain(b);

function Photo({ m, size }: { m: Manager; size: number }) {
  const [broken, setBroken] = useState(false);
  if (!m.logo || broken) return <TeamAvatar name={m.team} size={size} badge={false} className="[&>*:first-child]:rounded-2xl" />;
  return (
    <img
      src={espnImage(m.logo)}
      alt={clean(m.team)}
      onError={() => setBroken(true)}
      className="rounded-2xl border-2 border-black object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-bold tabular sm:text-2xl">{children}</div>
    </div>
  );
}

function Section({ icon, title, sub, children, className }: { icon: ReactNode; title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-orange-300">{icon}</span> {title}
        </CardTitle>
        {sub && <CardDescription>{sub}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const TIER: Record<Achievement["tier"], string> = {
  gold: "var(--gold)",
  red: "var(--red)",
  blue: "var(--blue)",
  win: "var(--win)",
  fun: "200 80% 70%",
};

/** ბეჯი: მიღებული — ფერადი, დანარჩენი — ჩაკეტილი */
function BadgeTile({ b, i }: { b: Achievement; i: number }) {
  return (
    <div
      title={b.desc}
      className={cn(
        "badge-in group/b relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-300",
        b.earned
          ? "border-[hsl(var(--c)/0.35)] bg-[hsl(var(--c)/0.08)] hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_hsl(var(--c)/0.7)]"
          : "border-white/[0.06] bg-white/[0.02]",
      )}
      style={{ ["--c" as string]: TIER[b.tier], animationDelay: `${i * 45}ms` }}
    >
      <span className={cn("text-3xl transition-transform duration-300", b.earned ? "group-hover/b:scale-125 group-hover/b:-rotate-6" : "opacity-25 grayscale")}>
        {b.icon}
      </span>
      <span className={cn("text-xs font-medium leading-tight", !b.earned && "text-muted-foreground/60")}>{b.name}</span>
      <span className="text-[10px] leading-tight text-muted-foreground">{b.desc}</span>
      {!b.earned && <Lock className="absolute right-2 top-2 h-3 w-3 text-muted-foreground/40" />}
    </div>
  );
}

/** გუნდის ისტორია და წარმოსახვითი ფანბეისი */
function Story({ lore, c1, left, right }: { lore: Lore; c1: string; left?: ReactNode; right?: ReactNode }) {
  const rows: [string, string, string][] = [
    ["📣", "სიმღერა", lore.fans.chant],
    ["🐾", "მასკოტი", lore.fans.mascot],
    ["🏟️", "არენა", lore.fans.arena],
    ["⚔️", "მთავარი მეტოქე", lore.fans.rival],
    ["🕯️", "რიტუალი", lore.fans.ritual],
  ];
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1" style={{ background: c1 }} />
          <CardContent className="space-y-4 p-5 sm:p-7">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">📖 ისტორია</div>
            <p className="text-xl font-semibold italic leading-snug sm:text-2xl">„{lore.tagline}“</p>
            <p className="leading-relaxed text-muted-foreground">{lore.story}</p>
          </CardContent>
        </Card>
        {left}
      </div>
      <div className="space-y-6">
        <Card className="overflow-hidden" style={{ background: `radial-gradient(120% 100% at 100% 0%, ${c1}26, transparent 60%), hsl(var(--card) / 0.9)` }}>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">👥 ფანბეისი</div>
              <div className="mt-1 text-2xl font-bold tracking-tight">{lore.fans.name}</div>
              <div className="mt-0.5 text-sm text-orange-200/80">{lore.fans.size}</div>
            </div>
            <p className="text-sm text-muted-foreground">{lore.fans.vibe}</p>
            <div className="space-y-2">
              {rows.map(([icon, label, text]) => (
                <div key={label} className="flex gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-sm">
                  <span className="text-base">{icon}</span>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
                    <div>{text}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70">* გამოგონილია, გასართობად.</p>
          </CardContent>
        </Card>
        {right}
      </div>
    </div>
  );
}

/** გვერდის ფონზე — იმ NBA გუნდის ლოგო და ფერები, რომლის გულშემატკივარიცაა */
function FanBackdrop({ fan, c1, c2 }: { fan: string; c1: string; c2: string }) {
  return createPortal(
    <div aria-hidden className="fan-bg pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(70% 60% at 85% 20%, ${c1}30, transparent 70%), radial-gradient(60% 60% at 10% 90%, ${c2}20, transparent 70%)` }}
      />
      <img src={nbaLogo(fan)} alt="" className="fan-logo absolute -right-[12vw] top-[8vh] h-[85vh] w-[85vh] max-w-none object-contain opacity-[0.07]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
    </div>,
    document.body,
  );
}

export default function TeamProfile() {
  const { tid } = useParams();
  const data = useData();
  const m = data.managers.find((x) => String(x.tid) === tid);
  const pick = useApi<PickemData>("/api/pickem");
  if (!m) return <Navigate to="/managers" replace />;

  const nba = m.fan ? NBA[m.fan] : undefined;
  const c1 = nba?.primary ?? "#f97316";
  const c2 = nba?.secondary ?? "#3b82f6";
  const rank = data.current.standings.findIndex((t) => same(t.name, m.team)) + 1;
  const cur = data.current.standings[rank - 1];
  const at = data.alltime.find((r) => same(r.team, m.team));

  // ბოლო დასრულებული სეზონის კვირები
  const last = data.seasons.find((s) => s.complete);
  const weekly = last?.weekly.teams.find((t) => m.seasons.some((s) => s.season === last.label && same(s.team, t.name)) || same(t.name, m.team));
  const cells = weekly?.scores ?? [];
  const vals = cells.map((c) => (c ? c[0] : 0));
  const max = Math.max(1, ...vals);
  const min = Math.min(...vals.filter(Boolean), max);

  // H2H
  const { teams, cells: h2h } = data.h2h;
  const me = teams.findIndex((t) => same(t, m.team) || m.seasons.some((x) => same(x.team, t)));
  const rivals =
    me >= 0
      ? teams
          .map((t, j) => ({ team: t, w: h2h[me][j][0], l: h2h[me][j][1] }))
          .filter((r, j) => j !== me && r.w + r.l > 0)
          .sort((a, b) => b.w - b.l - (a.w - a.l))
      : [];

  // ტრეიდები ამ სეზონში
  const trades = (data.trades?.current ?? []).filter((t) => t.sides.some((s) => same(s.team, m.team) || (s.to != null && same(s.to, m.team))));
  const pickRow = pick.state.status === "ready" ? pick.state.data.leaderboard.find((r) => r.tid === m.tid) : undefined;
  const pickRank = pick.state.status === "ready" ? pick.state.data.leaderboard.findIndex((r) => r.tid === m.tid) + 1 : 0;

  const badges = achievements(data, m, pickRow);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6 pb-4 pt-8 md:pt-12">
      {m.fan && <FanBackdrop key={m.fan} fan={m.fan} c1={c1} c2={c2} />}
      {/* ჰერო */}
      <Card
        className="overflow-hidden"
        style={
          {
            borderColor: `${c1}55`,
            background: `radial-gradient(120% 120% at 100% 0%, ${c1}40, transparent 55%), radial-gradient(80% 90% at 0% 100%, ${c2}22, transparent 60%), linear-gradient(180deg, hsl(var(--card) / 0.92), hsl(var(--card) / 0.86))`,
          } as CSSProperties
        }
      >
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
        {m.fan && (
          <img
            src={nbaLogo(m.fan)}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rotate-[-8deg] object-contain opacity-[0.1]"
          />
        )}
        <CardContent className="relative space-y-6 p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="hero-in w-fit shrink-0 self-start rounded-[20px] p-[3px] sm:self-auto"
              style={{
                background: `conic-gradient(from 210deg, ${c2}, ${c1}, ${c2})`,
              }}
            >
              <Photo m={m} size={112} />
            </div>
            <div className="min-w-0 space-y-2">
              <div className="hero-in flex flex-wrap items-center gap-2" style={{ animationDelay: "60ms" }}>
                <Badge variant="outline" className="border-white/15 font-mono">
                  {m.abbrev}
                </Badge>
                {m.rookie && <Badge variant="gold">Rookie</Badge>}
                {m.titles > 0 && (
                  <Badge variant="gold" className="gap-1">
                    <Crown className="h-3 w-3" /> {m.titles}× ჩემპიონი
                  </Badge>
                )}
                {rank > 0 && <Badge variant="secondary">#{rank} ცხრილში</Badge>}
              </div>
              <h1 className="hero-in page-title break-words text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ animationDelay: "100ms" }}>
                {clean(m.team)}
              </h1>
              {nba && (
                <div
                  className="hero-in inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 py-0.5 pl-0.5 pr-2.5 text-xs text-muted-foreground"
                  style={{ animationDelay: "140ms" }}
                >
                  <img src={nbaLogo(m.fan!)} alt="" className="h-5 w-5 rounded-full bg-white object-contain p-[1px]" />
                  {nba.name} fan
                </div>
              )}
            </div>
            {m.ovr != null && (
              <div
                className="hero-in grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/40 text-center backdrop-blur sm:ml-auto"
                style={{ animationDelay: "180ms" }}
              >
                <div>
                  <div className="text-3xl font-extrabold leading-none tabular">
                    <CountUp value={m.ovr} />
                  </div>
                  <div className="mt-1 text-[10px] tracking-widest text-muted-foreground">OVR</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="კარიერა">{m.rookie ? "-" : `${m.w}-${m.l}`}</Stat>
            <Stat label="მოგება %">{at && at.w + at.l > 0 ? <CountUp value={at.pct * 100} decimals={1} suffix="%" /> : "-"}</Stat>
            <Stat label="PPG">{m.ppg ? <CountUp value={m.ppg} /> : "-"}</Stat>
            <Stat label="საუკეთესო კვირა">{m.best_week ? <CountUp value={m.best_week} /> : "-"}</Stat>
            <Stat label="პლეიოფი">{m.rookie ? "-" : <CountUp value={m.playoffs} />}</Stat>
            <Stat label={`${data.current.label}`}>{cur ? `${cur.w}-${cur.l}` : "-"}</Stat>
          </div>
        </CardContent>
      </Card>

      {LORE[m.tid] ? (
        <Story lore={LORE[m.tid]} c1={c1} left={<Connections data={data} m={m} part="map" />} right={<Connections data={data} m={m} part="list" />} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <Connections data={data} m={m} part="map" />
          <Connections data={data} m={m} part="list" />
        </div>
      )}

      {/* მიღწევები */}
      <Section icon={<Award className="h-4 w-4" />} title="მიღწევები" sub={`${earned} / ${badges.length} მიღებული · მიიტანე მაუსი დეტალებისთვის`}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {badges.map((b, i) => (
            <BadgeTile key={b.id} b={b} i={i} />
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {/* როსტერი */}
          <Section icon={<Shirt className="h-4 w-4" />} title="შემადგენლობა" sub={m.roster.length ? `${m.roster.length} მოთამაშე · საშუალო ქულით` : undefined}>
            {m.roster.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-muted-foreground">როსტერი დრაფტის შემდეგ გამოჩნდება.</p>
            ) : (
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {m.roster.map((p) => (
                  <div key={p.pid} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
                    <PlayerPhoto pid={p.pid} className="h-10 w-10 shrink-0 rounded-full border bg-muted object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {p.name}
                        {p.injury && (
                          <Badge variant="loss" className="px-1 py-0 text-[9px]">
                            {p.injury.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.pos} · {p.pro}
                      </div>
                    </div>
                    <div className="text-right font-mono text-sm tabular">{p.avg || "-"}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* კვირები */}
          {vals.length > 0 && last && (
            <Section icon={<TrendingUp className="h-4 w-4" />} title={`${last.label}, კვირების მიხედვით`} sub="მწვანე = მოგება, წითელი = წაგება">
              <div className="flex h-36 items-end gap-[3px]">
                {cells.map((c, i) => (
                  <div
                    key={i}
                    title={c ? `კვირა ${i + 1}: ${c[0]}` : ""}
                    className={cn(
                      "bar-grow flex-1 origin-bottom rounded-t-sm",
                      !c ? "bg-white/5" : c[1] === 1 ? "bg-win/70" : c[1] === 0 ? "bg-loss/60" : "bg-white/30",
                    )}
                    style={{
                      height: c ? `${12 + ((c[0] - min) / Math.max(1, max - min)) * 88}%` : "6%",
                      animationDelay: `${150 + i * 30}ms`,
                    }}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* ტრეიდები */}
          <Section icon={<ArrowLeftRight className="h-4 w-4" />} title="ტრეიდები ამ სეზონში">
            {trades.length === 0 ? (
              <p className="text-sm text-muted-foreground">ჯერ ტრეიდი არ ყოფილა.</p>
            ) : (
              <div className="space-y-2">
                {trades.map((t, i) => (
                  <div key={i} className="rounded-lg border border-white/10 p-3 text-sm">
                    <div className="mb-1 text-xs text-muted-foreground">{t.date}</div>
                    {t.sides.map((s, k) => (
                      <div key={k}>
                        <b>{clean(s.team)}</b> → {clean(s.to ?? "?")}: {s.gives.map((g) => g.name).join(", ")}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          {/* პროგნოზები */}
          <Section icon={<Target className="h-4 w-4" />} title="პროგნოზები">
            {pickRow ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-3xl font-bold tabular">{pickRow.points}</div>
                  <div className="text-xs text-muted-foreground">
                    ქულა · #{pickRank} · {pickRow.total ? `${pickRow.correct}/${pickRow.total} სწორი` : "ჯერ არ დათვლილა"}
                  </div>
                </div>
                <div className="text-right text-sm">
                  {pickRow.oracle > 0 && <div>👑 ×{pickRow.oracle}</div>}
                  {pickRow.perfect > 0 && <div>💯 ×{pickRow.perfect}</div>}
                  <Link to="/predictions" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                    პროგნოზები →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">იტვირთება…</p>
            )}
          </Section>

          {/* H2H */}
          <Section icon={<Swords className="h-4 w-4" />} title="Head to Head" sub="ყველა სეზონი, რეგულარული">
            {rivals.length === 0 ? (
              <p className="text-sm text-muted-foreground">ჯერ არცერთი შეხვედრა.</p>
            ) : (
              <div className="space-y-2">
                {rivals.map((r) => {
                  const pct = r.w / (r.w + r.l);
                  const other = data.managers.find((x) => same(x.team, r.team) || x.seasons.some((z) => same(z.team, r.team)));
                  return (
                    <Link
                      key={r.team}
                      to={other ? `/team/${other.tid}` : "/h2h"}
                      className="block rounded-lg px-1 py-1 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <TeamAvatar name={r.team} size={22} badge={false} />
                        <span className="flex-1 truncate">{clean(r.team)}</span>
                        <span className={cn("font-mono tabular", r.w > r.l ? "text-win" : r.w < r.l ? "text-loss" : "text-muted-foreground")}>
                          {r.w}-{r.l}
                        </span>
                      </div>
                      <div className="mt-1 flex h-1 overflow-hidden rounded-full bg-loss/40">
                        <div className="bar-fill h-full origin-left bg-win" style={{ width: `${pct * 100}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>

          {/* კარიერა */}
          {m.seasons.length > 0 && (
            <Section icon={<CalendarRange className="h-4 w-4" />} title="სეზონები">
              <ol className="relative space-y-3 border-l border-white/10 pl-4">
                {m.seasons.map((s) => (
                  <li key={s.season} className="relative">
                    <span className={cn("absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-black", s.champ ? "bg-gold" : "bg-white/30")} />
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-muted-foreground">{s.season}</span>
                      <span className="font-medium">{s.rec}</span>
                      {s.champ && (
                        <Badge variant="gold" className="gap-1 py-0">
                          <Crown className="h-3 w-3" /> ჩემპიონი
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{clean(s.team)}</div>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>
      </div>

      {/* სხვა გუნდები */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {data.managers
          .filter((x) => x.tid !== m.tid)
          .map((x) => (
            <Link
              key={x.tid}
              to={`/team/${x.tid}`}
              title={clean(x.team)}
              className="rounded-full transition-transform duration-200 hover:-translate-y-1 hover:scale-110"
            >
              <TeamAvatar name={x.team} size={36} />
            </Link>
          ))}
      </div>
    </div>
  );
}
