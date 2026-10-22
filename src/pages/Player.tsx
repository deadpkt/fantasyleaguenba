import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftRight, CalendarDays, History, ListOrdered } from "lucide-react";
import type { PlayerCard } from "@/types";
import { useApi } from "@/lib/useApi";
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
const usDay = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 5 * 3600_000);
  return `${WEEKDAY[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}`;
};
const tbilisi = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tbilisi" }) : "";

const nbaTeam = (pro: string | null) => (pro ? NBA[pro.toLowerCase()] ?? NBA[{ GS: "gsw", NO: "nop", NY: "nyk", SA: "sas", UTAH: "uta", WSH: "was" }[pro] ?? ""] : undefined);

function Section({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card>
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
  if (broken) return <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">{name.slice(0, 1)}</div>;
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

export default function Player() {
  const { pid } = useParams();
  const data = useData();
  const { state } = useApi<PlayerCard>(`/api/player?pid=${pid}`);

  if (state.status === "loading")
    return (
      <div className="space-y-6 pt-8 md:pt-12">
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
      </div>
    );
  if (state.status === "error") return <p className="pt-12 text-sm text-loss">ვერ ჩაიტვირთა: {state.message}</p>;

  const p = state.data;
  const nba = nbaTeam(p.pro);
  const c1 = nba?.primary ?? "#888";
  const ownerTid = p.owner?.tid ?? null;
  const s = p.season;
  const trades = (data.trades?.current ?? []).filter((t) => t.sides.some((sd) => sd.gives.some((g) => g.pid === p.pid)));
  const tidOf = (team: string) => data.managers.find((m) => plain(m.team) === plain(team))?.tid;

  return (
    <div className="space-y-6 pb-4 pt-8 md:pt-12">
      {/* ჰერო */}
      <section className="hero-in overflow-hidden rounded-2xl border border-white/[0.08] bg-card/95">
        <div className="h-1" style={{ background: c1 }} />
        <div className="space-y-6 p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-muted sm:h-32 sm:w-32">
              <Photo pid={p.pid} name={p.name} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="break-words text-4xl font-semibold tracking-tight sm:text-5xl">{p.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{p.pos}</span>
                {p.pro && (
                  <span className="flex items-center gap-1.5">
                    <img src={nbaLogo(p.pro.toLowerCase())} alt="" className="h-4 w-4 rounded-full bg-white object-contain p-[1px]" />
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
                <Link to={ownerTid != null ? `/team/${ownerTid}` : "/managers"} className="mt-1 flex items-center gap-2 hover:underline sm:justify-end">
                  <TeamAvatar name={p.owner.team} size={26} badge={false} />
                  <span className="font-medium">{clean(p.owner.team)}</span>
                </Link>
              ) : (
                <div className="mt-1 font-medium text-win">თავისუფალი აგენტი</div>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-y-4 border-t border-white/[0.08] pt-5 sm:grid-cols-3 lg:grid-cols-5">
            {(
              [
                ["ქულა სეზონში", s.total ? fmt(s.total) : "-"],
                ["საშუალო", s.gp ? String(s.avg) : "-"],
                ["თამაშები", String(s.gp)],
                ["მოსალოდნელი თამაშზე", String(s.per_game)],
                [p.last_season ? `${p.last_season.season}, საშ.` : "წინა სეზონი", p.last_season ? `${p.last_season.avg}` : "-"],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="border-l border-white/[0.08] pl-4">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular">{value}</dd>
              </div>
            ))}
          </dl>

          {s.line && s.gp > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {Object.entries(s.line).map(([k, v]) => (
                <span key={k}>
                  <span className="font-semibold tabular">{k.includes("%") ? `${(v * 100).toFixed(1)}` : v}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{k}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* თამაშების ჟურნალი */}
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

        <div className="space-y-6">
          {/* მომავალი თამაშები */}
          {p.upcoming.length > 0 && (
            <Section icon={<CalendarDays className="h-4 w-4" />} title="შემდეგი თამაშები" sub="დრო თბილისით">
              <div className="divide-y divide-white/[0.05]">
                {p.upcoming.map((g) => (
                  <div key={g.sp} className="flex items-center justify-between py-2 text-sm">
                    <span>{usDay(g.date)}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-medium">vs {g.opp}</span>
                      <span className="w-11 text-right text-muted-foreground tabular">{tbilisi(g.date)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ლიგის ისტორია */}
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
                        <ArrowLeftRight className="h-3 w-3" /> ტრეიდი, {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
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
                        სეზონი: {fmt(Math.round(d.total))} ქულა, {d.avg} საშ.{d.rank ? `, #${d.rank} ლიგაში` : ""}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <div className="text-right">
            <Updated at={p.updated} />
          </div>
        </div>
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
