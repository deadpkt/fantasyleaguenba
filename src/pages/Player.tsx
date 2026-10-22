import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftRight, CalendarDays, ChevronDown, History, ListOrdered, Newspaper, Sigma, Timer } from "lucide-react";
import type { PlayerCard } from "@/types";
import { useApi } from "@/lib/useApi";
import { normalizePlayer } from "@/lib/normalize";
import { useData } from "@/lib/league";
import { clean, fmt, plain } from "@/lib/format";
import { headshot } from "@/lib/logos";
import { NBA, nbaLogo } from "@/lib/nba";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamAvatar } from "@/components/league/team";
import Updated from "@/components/league/Updated";

const WEEKDAY = ["კვ", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
const MONTH = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
/** თამაშის დღე ამერიკული დროით (თბილისში ღამის თამაში შემდეგ დღეზე გადადის) */
const usDate = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - 5 * 3600_000) : null);
const usDay = (iso: string | null) => {
  const d = usDate(iso);
  return d ? `${WEEKDAY[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}` : "";
};
const tbilisi = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tbilisi",
      })
    : "";

/** espn-api-ის კოდი (GSW, NOP...) → ESPN-ის ლოგოს/ფერების კოდი (gs, no...) */
const CODE: Record<string, string> = {
  GSW: "gs",
  NOP: "no",
  NYK: "ny",
  SAS: "sa",
  UTA: "utah",
  WAS: "wsh",
  PHL: "phi",
  PHO: "phx",
};
const logoCode = (pro: string) => CODE[pro] ?? pro.toLowerCase();
const nbaTeam = (pro: string | null) => (pro ? NBA[logoCode(pro)] : undefined);

const LINE = ["PTS", "REB", "AST", "STL", "BLK", "3PM", "TO", "FG%", "FT%", "MIN"] as const;
const val = (k: string, v: number | undefined) => (v == null ? "-" : k.includes("%") ? (v * 100).toFixed(1) : v.toFixed(1));

function Section({ icon, title, sub, children, className }: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-muted-foreground">{icon}</span> {title}
        </CardTitle>
        {sub && <CardDescription>{sub}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Photo({ pid, name }: { pid: number; name: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-muted-foreground">{name.slice(0, 1)}</div>;
  return <img src={headshot(pid)} alt={name} onError={() => setBroken(true)} className="h-full w-full object-cover object-top" />;
}

/** ბოლო თამაშების ფანტაზი ქულები სვეტებად, საშუალოს ხაზით */
function Form({ games, avg }: { games: PlayerCard["games"]; avg: number }) {
  const list = games.slice(0, 15).reverse();
  if (list.length < 2) return null;
  const max = Math.max(...list.map((g) => g.fpts), avg, 1);
  return (
    <div className="relative mb-5 flex h-28 items-end gap-1">
      <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/25" style={{ bottom: `${(avg / max) * 100}%` }}>
        <span className="absolute -top-4 right-0 text-[10px] text-muted-foreground">საშ. {avg}</span>
      </div>
      {list.map((g) => (
        <div
          key={g.sp}
          title={`${usDay(g.date)} vs ${g.opp}: ${g.fpts}`}
          className={cn("bar-grow flex-1 origin-bottom rounded-t-sm", g.fpts >= avg ? "bg-win/70" : "bg-white/25")}
          style={{ height: `${Math.max(4, (g.fpts / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/** სეზონი / ESPN-ის პროგნოზი / წინა სეზონი ერთ ცხრილში */
function Averages({ p }: { p: PlayerCard }) {
  const rows: [string, number | null, Record<string, number> | null | undefined][] = [
    [p.season.label, p.season.gp ? p.season.avg : null, p.season.gp ? p.season.line : null],
    ["ESPN პროგნოზი", p.projection?.avg ?? null, p.projection?.line],
    ...(p.last_season ? [[p.last_season.season, p.last_season.avg, p.last_season.line] as [string, number, Record<string, number> | null | undefined]] : []),
  ];
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-[620px] text-right text-sm tabular">
        <thead className="text-[11px] text-muted-foreground">
          <tr className="[&>th]:pb-2 [&>th]:font-normal">
            <th className="text-left" />
            <th className="text-foreground">ქულა</th>
            {LINE.map((k) => (
              <th key={k}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {rows.map(([label, fp, line], i) => (
            <tr key={label} className={cn("[&>td]:py-2.5", i > 0 && "text-muted-foreground")}>
              <td className="whitespace-nowrap text-left text-xs">{label}</td>
              <td className={cn("font-semibold", i === 0 && "text-foreground")}>{fp == null ? "-" : fp.toFixed(1)}</td>
              {LINE.map((k) => (
                <td key={k}>{line ? val(k, line[k]) : "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Outlook({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className={cn("text-sm leading-relaxed text-muted-foreground", !open && "line-clamp-4")}>{text}</p>
      <button type="button" onClick={() => setOpen(!open)} className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        {open ? "ნაკლები" : "სრულად"} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
    </div>
  );
}

export default function Player() {
  const { pid } = useParams();
  const data = useData();
  const { state } = useApi<PlayerCard>(`/api/player?pid=${pid}`, 60_000);

  if (state.status === "loading")
    return (
      <div className="space-y-6 pt-8 md:pt-12">
        <Skeleton className="h-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 lg:col-span-2" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  if (state.status === "error") return <p className="pt-12 text-sm text-loss">ვერ ჩაიტვირთა: {state.message}</p>;

  const p = normalizePlayer(state.data);
  const nba = nbaTeam(p.pro);
  const c1 = nba?.primary ?? "#888";
  const s = p.season;
  const trades = (data.trades?.current ?? []).filter((t) => t.sides.some((sd) => sd.gives.some((g) => g.pid === p.pid)));
  const tidOf = (team: string) => data.managers.find((m) => plain(m.team) === plain(team))?.tid;
  // ამ კვირის თამაშები: ლიგის მონაცემებიდან (გუნდის როსტერი ან თავისუფალი აგენტები)
  const mine = data.managers.flatMap((m) => m.roster).find((r) => r.pid === p.pid) ?? data.waivers.find((w) => w.pid === p.pid);
  const next = p.upcoming[0];

  const strip: [string, string][] = [
    ["ქულა სეზონში", s.total ? fmt(s.total) : "-"],
    ["საშუალო", s.gp ? String(s.avg) : "-"],
    ["თამაშები", String(s.gp)],
    ["პოზიციაზე", p.pos_rank ? `#${p.pos_rank} ${p.pos ?? ""}` : "-"],
    ["ჰყავთ ESPN-ზე", p.owned != null ? `${p.owned}%` : "-"],
    ["საშ. დრაფტის პიკი", p.adp ? String(p.adp) : "-"],
  ];

  return (
    <div className="space-y-6 pb-4 pt-8 md:pt-12">
      {/* ჰერო */}
      <section className="hero-in relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card/95">
        <div className="h-1" style={{ background: c1 }} />
        {p.jersey && (
          <span className="pointer-events-none absolute -right-2 top-2 select-none text-[9rem] font-bold leading-none text-white/[0.04] sm:text-[12rem]">{p.jersey}</span>
        )}
        <div className="relative space-y-6 p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div
              className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-muted sm:h-36 sm:w-36"
              style={{
                background: `linear-gradient(180deg, ${c1}33, transparent)`,
              }}
            >
              <Photo pid={p.pid} name={p.name} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="break-words text-4xl font-semibold tracking-tight sm:text-5xl">{p.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{p.pos}</span>
                {p.jersey && <span>#{p.jersey}</span>}
                {p.pro && (
                  <span className="flex items-center gap-1.5">
                    <img src={nbaLogo(logoCode(p.pro))} alt="" className="h-4 w-4 rounded-full bg-white object-contain p-[1px]" />
                    {nba?.name ?? p.pro}
                  </span>
                )}
                {p.injury && (
                  <span className="rounded bg-loss/15 px-1.5 text-xs font-medium text-loss">
                    {p.injury.replace(/_/g, " ")}
                    {p.return && `, დაბრუნება ~${p.return.slice(5).split("-").reverse().join(".")}`}
                  </span>
                )}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-muted-foreground">ფანტაზი გუნდი</div>
              {p.owner ? (
                <Link to={`/team/${p.owner.tid}`} className="mt-1 flex items-center gap-2 hover:underline sm:justify-end">
                  <TeamAvatar name={p.owner.team} size={26} badge={false} />
                  <span className="font-medium">{clean(p.owner.team)}</span>
                </Link>
              ) : (
                <div className="mt-1 font-medium text-win">თავისუფალი აგენტი</div>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-y-4 border-t border-white/[0.08] pt-5 sm:grid-cols-3 lg:grid-cols-6">
            {strip.map(([label, value]) => (
              <div key={label} className="border-l border-white/[0.08] pl-4">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ამ კვირა + საშუალოები */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
        <Section icon={<Timer className="h-4 w-4" />} title="ამ კვირაში">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-4xl font-semibold tabular">{mine?.week_left ?? 0}</div>
              <div className="text-xs text-muted-foreground">თამაში დარჩა</div>
            </div>
            <div>
              <div className="text-4xl font-semibold tabular">~{Math.round(mine?.week_expected ?? 0)}</div>
              <div className="text-xs text-muted-foreground">მოსალოდნელი ქულა</div>
            </div>
          </div>
          {next && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.08] p-3">
              {next.opp && <img src={nbaLogo(logoCode(next.opp))} alt="" className="h-9 w-9 rounded-full bg-white object-contain p-1" />}
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">შემდეგი თამაში</div>
                <div className="text-sm font-medium">
                  vs {next.opp}, {usDay(next.date)}
                </div>
              </div>
              <div className="ml-auto text-lg font-semibold tabular">{tbilisi(next.date)}</div>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">მოსალოდნელი ქულა თამაშზე: {s.per_game}</p>
        </Section>

        <Section icon={<Sigma className="h-4 w-4" />} title="საშუალოები თამაშზე" sub="ეს სეზონი, ESPN-ის პროგნოზი და წინა სეზონი">
          <Averages p={p} />
        </Section>
      </div>

      {/* თამაშები და სიახლეები | განრიგი, ლიგაში, შეფასება */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Section icon={<ListOrdered className="h-4 w-4" />} title="თამაშები" sub={`${s.label} სეზონი, ბოლო პირველი`}>
            {p.games.length === 0 ? (
              <p className="text-sm text-muted-foreground">ამ სეზონში ჯერ არ უთამაშია.</p>
            ) : (
              <>
                <Form games={p.games} avg={s.avg} />
                <div className="-mx-2 overflow-x-auto px-2">
                  <table className="w-full min-w-[560px] text-right text-sm tabular">
                    <thead className="text-[11px] text-muted-foreground">
                      <tr className="[&>th]:pb-2 [&>th]:font-normal">
                        <th className="text-left">დღე</th>
                        <th className="text-left">მეტოქე</th>
                        <th className="text-foreground">ქულა</th>
                        <th>PTS</th>
                        <th>REB</th>
                        <th>AST</th>
                        <th>STL</th>
                        <th>BLK</th>
                        <th>3PM</th>
                        <th>TO</th>
                        <th>FG</th>
                        <th>MIN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {p.games.map((g) => (
                        <tr key={g.sp} className="[&>td]:py-2">
                          <td className="whitespace-nowrap text-left text-muted-foreground">{usDay(g.date)}</td>
                          <td className="text-left">{g.opp}</td>
                          <td className={cn("font-semibold", g.fpts >= s.avg ? "text-win" : "text-foreground")}>{g.fpts}</td>
                          <td>{g.line.PTS}</td>
                          <td>{g.line.REB}</td>
                          <td>{g.line.AST}</td>
                          <td>{g.line.STL}</td>
                          <td>{g.line.BLK}</td>
                          <td>{g.line["3PM"]}</td>
                          <td>{g.line.TO}</td>
                          <td className="whitespace-nowrap">
                            {g.line.FGM}/{g.line.FGA}
                          </td>
                          <td>{g.line.MIN}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Section>
          {/* სიახლეები */}
          {p.news.length > 0 && (
            <Section icon={<Newspaper className="h-4 w-4" />} title="სიახლეები" sub="ESPN Fantasy, ინგლისურად">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {p.news.map((n, i) => (
                  <article key={i} className="rounded-xl border border-white/[0.08] p-4">
                    <div className="text-[11px] text-muted-foreground">
                      {n.date
                        ? new Date(n.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : ""}
                    </div>
                    <h3 className="mt-1 text-sm font-medium leading-snug">{n.headline}</h3>
                    {n.story && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{n.story}</p>}
                  </article>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          {p.upcoming.length > 0 && (
            <Section icon={<CalendarDays className="h-4 w-4" />} title="შემდეგი თამაშები" sub="დრო თბილისით">
              <div className="space-y-1">
                {p.upcoming.map((g, i) => {
                  const d = usDate(g.date);
                  return (
                    <div key={g.sp} className={cn("flex items-center gap-3 rounded-lg px-2 py-1.5", i === 0 && "bg-white/[0.05]")}>
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">{d ? `${WEEKDAY[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}` : ""}</span>
                      {g.opp && <img src={nbaLogo(logoCode(g.opp))} alt="" className="h-6 w-6 shrink-0 rounded-full bg-white object-contain p-0.5" />}
                      <span className="flex-1 text-sm font-medium">vs {g.opp}</span>
                      <span className="text-xs text-muted-foreground tabular">{tbilisi(g.date)}</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
          <Section icon={<History className="h-4 w-4" />} title="ლიგაში" sub="დრაფტები და ტრეიდები">
            {p.drafts.length === 0 && trades.length === 0 ? (
              <p className="text-sm text-muted-foreground">ჩვენს დრაფტებზე არავის აუყვანია.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-white/10 pl-4">
                {trades.map((t, i) => {
                  const from = t.sides.find((sd) => sd.gives.some((g) => g.pid === p.pid));
                  const to = t.sides.find((sd) => sd !== from);
                  return (
                    <li key={`t${i}`} className="relative text-sm">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-white ring-4 ring-black" />
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ArrowLeftRight className="h-3 w-3" /> ტრეიდი,{" "}
                        {new Date(t.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                      <div>
                        {from && <TeamLink team={from.team} tid={tidOf(from.team)} />} → {to && <TeamLink team={to.team} tid={tidOf(to.team)} />}
                      </div>
                    </li>
                  );
                })}
                {p.drafts.map((d) => (
                  <li key={d.season} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-white/30 ring-4 ring-black" />
                    <div className="text-xs text-muted-foreground">
                      {d.season} დრაფტი, რაუნდი {d.round}, პიკი {d.n}
                    </div>
                    <TeamLink team={d.team} tid={tidOf(d.team)} />
                    {d.total != null && (
                      <div className="text-xs text-muted-foreground tabular">
                        სეზონი: {fmt(Math.round(d.total))} ქულა, {d.avg} საშ.
                        {d.rank ? `, #${d.rank} ლიგაში` : ""}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {p.outlook && (
            <Section icon={<Sigma className="h-4 w-4" />} title="ESPN-ის შეფასება" sub="სეზონის წინ, ინგლისურად">
              <Outlook text={p.outlook} />
            </Section>
          )}
        </div>
      </div>

      <div className="text-right">
        <Updated at={p.updated} />
      </div>
    </div>
  );
}

function TeamLink({ team, tid }: { team: string; tid?: number }) {
  const body = (
    <span className="inline-flex items-center gap-1.5 font-medium">
      <TeamAvatar name={team} size={18} badge={false} />
      {clean(team)}
    </span>
  );
  return tid != null ? (
    <Link to={`/team/${tid}`} className="hover:underline">
      {body}
    </Link>
  ) : (
    body
  );
}
