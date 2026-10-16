import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { DraftPick, Season } from "@/types";
import { useData } from "@/lib/league";
import { clean, fmt, signedPct } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { tone } from "@/lib/utils";
import { PlayerPhoto, Team, TeamAvatar } from "@/components/league/team";

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3 mt-10">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function Awards({ s }: { s: Season }) {
  const a = s.awards;
  const champ = s.standings.find((t) => t.final === 1);
  const items: { label: string; team?: string; name: string; value: string; pid?: number; t?: "gold" | "red" | "blue" | "win" }[] = [];
  if (champ) items.push({ t: "gold", label: "ჩემპიონი", team: champ.name, name: clean(champ.name), value: `${champ.w}-${champ.l} · ${fmt(champ.pf)} PF` });
  if (a.mvp) items.push({ t: "red", label: "სეზონის MVP", name: a.mvp.player, value: `${fmt(a.mvp.total)} FP · ${a.mvp.avg}/თამაში`, pid: a.mvp.pid });
  if (a.best_week) items.push({ t: "blue", label: "საუკეთესო კვირა", team: a.best_week.team, name: clean(a.best_week.team), value: `${fmt(a.best_week.v)} · კვირა ${a.best_week.p}` });
  items.push({ t: "win", label: "ყველაზე მეტი ქულა", team: a.pf.team, name: clean(a.pf.team), value: `${fmt(a.pf.v)} PF` });
  items.push({ label: "ყველაზე მეტი მიღებული", team: a.pa.team, name: clean(a.pa.team), value: `${fmt(a.pa.v)} PA` });
  items.push({ label: "Waiver მეფე", team: a.acq.team, name: clean(a.acq.team), value: `${a.acq.v} აყვანა` });
  if (a.trades.v) items.push({ label: "ტრეიდ-მასტერი", team: a.trades.team, name: clean(a.trades.team), value: `${a.trades.v} ტრეიდი` });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label} className={it.t ? "tone-card lift" : "lift"} style={it.t ? tone(it.t) : undefined}>
          <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
            {it.pid ? (
              <PlayerPhoto pid={it.pid} className="h-10 w-10 rounded-full border bg-muted" />
            ) : it.team ? (
              <TeamAvatar name={it.team} size={36} />
            ) : null}
            <div className="min-w-0">
              <CardDescription>{it.label}</CardDescription>
              <CardTitle className="truncate text-base">{it.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground tabular">{it.value}</CardContent>
        </Card>
      ))}
    </div>
  );
}

function FinalStandings({ s }: { s: Season }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>გუნდი</TableHead>
            <TableHead className="text-right">W-L</TableHead>
            <TableHead className="text-right">PF</TableHead>
            <TableHead className="hidden text-right sm:table-cell">PA</TableHead>
            <TableHead className="hidden text-right md:table-cell">Seed</TableHead>
            <TableHead className="hidden text-right md:table-cell">Adds</TableHead>
            <TableHead className="hidden text-right md:table-cell">Trades</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {s.standings.map((t, i) => (
            <TableRow key={t.name}>
              <TableCell className="text-muted-foreground">{t.final || i + 1}</TableCell>
              <TableCell>
                <Team name={t.name}>
                  {t.final === 1 && <Badge variant="gold">Champ</Badge>}
                  {t.final === 2 && <Badge variant="secondary">Final</Badge>}
                </Team>
              </TableCell>
              <TableCell className="text-right">
                {t.w}-{t.l}
              </TableCell>
              <TableCell className="text-right">{fmt(t.pf)}</TableCell>
              <TableCell className="hidden text-right sm:table-cell">{fmt(t.pa)}</TableCell>
              <TableCell className="hidden text-right md:table-cell">{t.seed}</TableCell>
              <TableCell className="hidden text-right md:table-cell">{t.acq}</TableCell>
              <TableCell className="hidden text-right md:table-cell">{t.trades}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/** გუნდები × კვირები. უჯრის სიმუქე = ქულა, მწვანე/წითელი ხაზი = მოგება/წაგება */
function Heatmap({ s }: { s: Season }) {
  const all = s.weekly.teams.flatMap((t) => t.scores.flatMap((x) => (x ? [x[0]] : [])));
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto p-3">
        <table className="border-separate border-spacing-1 text-xs tabular">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card" />
              {s.weekly.weeks.map((w) => (
                <th key={w} className="px-1 font-normal text-muted-foreground">
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.weekly.teams.map((t) => (
              <tr key={t.name}>
                <td className="sticky left-0 z-10 bg-card pr-3">
                  <Team name={t.name} className="w-32 sm:w-44" />
                </td>
                {t.scores.map((x, i) => {
                  if (!x) return <td key={i} />;
                  const k = (x[0] - lo) / Math.max(1, hi - lo);
                  return (
                    <td key={i}>
                      <div
                        title={`${clean(t.name)} · კვირა ${s.weekly.weeks[i]}: ${fmt(x[0])}`}
                        className="relative flex h-8 w-11 items-center justify-center rounded-md"
                        style={{ background: `hsl(0 0% ${10 + k * 55}%)`, color: k > 0.55 ? "#09090b" : "#fafafa" }}
                      >
                        {(x[0] / 1000).toFixed(1)}
                        <span
                          className={`absolute inset-x-1.5 bottom-0.5 h-0.5 rounded-full ${x[1] === 1 ? "bg-win" : x[1] === 0 ? "bg-loss" : ""}`}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 border-t px-4 py-3 text-xs text-muted-foreground">
        <span>ღია = მეტი ქულა (ათასებში)</span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-win" /> მოგება
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-loss" /> წაგება
        </span>
      </div>
    </Card>
  );
}

function Power({ s }: { s: Season }) {
  const max = Math.max(...s.power.map((p) => p.score));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Power Rankings</CardTitle>
        <CardDescription>ქულები, all-play და ბოლო კვირების ფორმა</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {s.power.map((p, i) => (
          <div key={p.name} className="grid grid-cols-[20px_1fr_44px] items-center gap-3 text-sm">
            <span className="text-muted-foreground tabular">{i + 1}</span>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <TeamAvatar name={p.name} size={20} badge={false} />
                <span className="truncate">{clean(p.name)}</span>
                <span className="ml-auto text-xs text-muted-foreground">{p.rec}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${(p.score / max) * 100}%` }} />
              </div>
            </div>
            <span className="text-right tabular">{p.score.toFixed(1)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Luck({ s }: { s: Season }) {
  const m = Math.max(0.05, ...s.luck.map((r) => Math.abs(r.luck)));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">იღბლის ინდექსი</CardTitle>
        <CardDescription>რეალური მოგება % − all-play % (შენი ქულა ყოველ კვირას ყველას წინააღმდეგ)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {s.luck.map((r) => {
          const w = (Math.abs(r.luck) / m) * 50;
          return (
            <div key={r.name} className="grid grid-cols-[minmax(0,1fr)_1.2fr_52px] items-center gap-3 text-sm">
              <span className="truncate">{clean(r.name)}</span>
              <div className="relative h-1.5 rounded-full bg-muted">
                <div className="absolute inset-y-0 left-1/2 w-px bg-muted-foreground/40" />
                <div
                  className={`absolute inset-y-0 rounded-full ${r.luck >= 0 ? "bg-win" : "bg-loss"}`}
                  style={r.luck >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }}
                />
              </div>
              <span className={`text-right tabular ${r.luck >= 0 ? "text-win" : "text-loss"}`}>{signedPct(r.luck)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PickRow({ x, up }: { x: DraftPick; up: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <PlayerPhoto pid={x.pid} className="h-10 w-10 shrink-0 rounded-full border bg-muted" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{x.player}</div>
        <div className="truncate text-xs text-muted-foreground">
          {clean(x.team)} · {fmt(x.total)} FP
        </div>
      </div>
      <Badge variant={up ? "win" : "loss"} className="gap-1 tabular">
        #{x.n} <ArrowRight className="h-3 w-3" /> #{x.rank}
      </Badge>
    </div>
  );
}

function Draft({ s }: { s: Season }) {
  const d = s.draft;
  if (!d) return null;
  return (
    <>
      <SectionTitle title="დრაფტის რეტროსპექტივა" description="პიკის ნომერი → სეზონის ბოლოს ადგილი ფანტაზი-ქულებით" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Steals</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {d.steals.map((x) => (
              <PickRow key={x.n} x={x} up />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Busts</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {d.busts.map((x) => (
              <PickRow key={x.n} x={x} up={false} />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">პირველი რაუნდი</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>მოთამაშე</TableHead>
                <TableHead className="hidden sm:table-cell">გუნდი</TableHead>
                <TableHead className="text-right">ადგილი</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.round1.map((x) => (
                <TableRow key={x.n}>
                  <TableCell className="text-muted-foreground">{x.n}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PlayerPhoto pid={x.pid} className="h-7 w-7 rounded-full border bg-muted" />
                      <span className="font-medium">{x.player}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Team name={x.team} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={x.rank <= x.n + 4 ? "win" : "loss"}>#{x.rank}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">დრაფტის შეფასებები</CardTitle>
            <CardDescription>სეზონის შედეგის მიხედვით</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {d.grades.map((g) => (
              <div key={g.team} className="flex items-center gap-3 py-2.5">
                <TeamAvatar name={g.team} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{clean(g.team)}</div>
                  <div className="truncate text-xs text-muted-foreground">საუკეთესო: {g.best}</div>
                </div>
                <span className="w-8 text-right text-lg font-semibold">{g.grade}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function Seasons() {
  const { seasons } = useData();
  const [tab, setTab] = useState(seasons[0]?.label ?? "");

  if (!seasons.length) {
    return (
      <>
        <PageHeader title="სეზონები" />
        <p className="text-sm text-muted-foreground">ჯერ დასრულებული მატჩები არ არის.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="სეზონები" description="ყოველი სეზონი: ჯილდოები, ცხრილი, კვირები, იღბალი და დრაფტი." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {seasons.map((s) => (
            <TabsTrigger key={s.label} value={s.label}>
              {s.label}
              {!s.complete && " · live"}
            </TabsTrigger>
          ))}
        </TabsList>
        {seasons.map((s) => (
          <TabsContent key={s.label} value={s.label}>
            <Awards s={s} />
            <SectionTitle title="საბოლოო ცხრილი" />
            <FinalStandings s={s} />
            <SectionTitle title="კვირიდან კვირამდე" description="ყველა გუნდის ქულები ყოველ კვირას" />
            <Heatmap s={s} />
            <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Power s={s} />
              <Luck s={s} />
            </div>
            <Draft s={s} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
