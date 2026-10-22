import { Trophy } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt, pct3 } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/layout/PageHeader";
import { Team, TeamAvatar } from "@/components/league/team";
import { tone } from "@/lib/utils";
import LastSeason from "@/components/league/LastSeason";
import DidYouKnow from "@/components/league/DidYouKnow";

export default function History() {
  const { champions, alltime, current } = useData();
  const played = alltime.filter((a) => a.w + a.l + a.t > 0);

  return (
    <>
      <PageHeader title="ისტორია" description="ჩემპიონები და All-Time ცხრილი ყველა სეზონიდან (რეგულარული სეზონის მატჩები)." />

      <div className="mb-12">
        <LastSeason />
      </div>

      <div className="mb-12">
        <DidYouKnow />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">ჩემპიონები</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...champions].reverse().map((c) => (
            <Card key={c.season} className="tone-card lift" style={tone("gold")}>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold" /> <span className="text-gold">{c.season} ჩემპიონი</span>
                </CardDescription>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <TeamAvatar name={c.team} size={48} />
                  <span className="truncate text-2xl">{clean(c.team)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="gold">{c.rec}</Badge>
                {c.runner && <span>ფინალი vs {clean(c.runner)}</span>}
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed bg-transparent shadow-none">
            <CardHeader>
              <CardDescription>{current.label}</CardDescription>
              <CardTitle className="text-xl text-muted-foreground">ჯერ არავინ</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">All-Time</h2>
          <p className="text-sm text-muted-foreground">OVR არის მენეჯერის რეიტინგი 60-დან 99-მდე. ითვლება მოგების %-ით, ქულებით და ტიტულებით.</p>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>მენეჯერი</TableHead>
                <TableHead className="text-right">OVR</TableHead>
                <TableHead className="text-right">W-L</TableHead>
                <TableHead className="hidden text-right sm:table-cell">PCT</TableHead>
                <TableHead className="hidden text-right md:table-cell">PPG</TableHead>
                <TableHead className="hidden text-right md:table-cell">Best wk</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Playoffs</TableHead>
                <TableHead className="text-right">Titles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {played.map((a, i) => (
                <TableRow key={a.team}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <Team name={a.team} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">{a.ovr}</TableCell>
                  <TableCell className="text-right">
                    {a.w}-{a.l}
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">{pct3(a.pct)}</TableCell>
                  <TableCell className="hidden text-right md:table-cell">{fmt(a.ppg)}</TableCell>
                  <TableCell className="hidden text-right md:table-cell">{fmt(a.best_week)}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">{a.playoffs}</TableCell>
                  <TableCell className="text-right">{a.titles ? <Badge variant="gold">{a.titles}</Badge> : "0"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </>
  );
}
