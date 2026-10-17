import { Calculator, ListChecks, Shield } from "lucide-react";
import { useData } from "@/lib/league";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/layout/PageHeader";

const fmtPts = (p: number) => `${p > 0 ? "+" : ""}${Number.isInteger(p) ? p : p.toFixed(1)}`;
const SLOT_KA: Record<string, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C: "Center",
  G: "Guard (PG/SG)",
  F: "Forward (SF/PF)",
  UT: "Utility (ნებისმიერი)",
  BE: "სკამი",
  IR: "დაშავებულები (IR)",
};

export default function Rules() {
  const { settings: s } = useData();
  if (!s) {
    return (
      <>
        <PageHeader title="წესები" />
        <p className="text-sm text-muted-foreground">ლიგის პარამეტრები ESPN-იდან ვერ ჩაიტვირთა.</p>
      </>
    );
  }
  const starters = s.roster.filter((r) => r.slot !== "BE" && r.slot !== "IR").reduce((a, r) => a + r.count, 0);

  return (
    <>
      <PageHeader title="წესები და ქულები" description="რამდენ ფანტაზი-ქულას იღებს მოთამაშე თითოეულ მოქმედებაზე — პირდაპირ ESPN-ის ლიგის პარამეტრებიდან." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* ტიპური მოქმედებები */}
        <Card className="tone-card" style={tone("gold")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4 text-gold" /> რამდენი ქულა იწერება?
            </CardTitle>
            <CardDescription>ESPN ერთ მოქმედებაზე რამდენიმე სტატს ერთად ითვლის — აქ უკვე შეკრებილია.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {s.examples.map((e) => (
              <div key={e.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                <span className="text-sm">{e.label}</span>
                <span className={cn("text-lg font-bold tabular", e.points > 0 ? "text-win" : "text-loss")}>{fmtPts(e.points)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* სრული ცხრილი */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4" /> ქულების სისტემა
            </CardTitle>
            <CardDescription>{s.scoring_type === "H2H_POINTS" ? "Head-to-Head Points" : s.scoring_type}</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>სტატისტიკა</TableHead>
                <TableHead className="text-right">ქულა</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.scoring.map((r) => (
                <TableRow key={r.abbr}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-12 justify-center border-white/15 font-mono text-[11px]">
                        {r.abbr}
                      </Badge>
                      <span>{r.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", r.points > 0 ? "text-win" : "text-loss")}>{fmtPts(r.points)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">როსტერი</CardTitle>
            <CardDescription>
              {starters} სტარტერი · {s.roster.find((r) => r.slot === "BE")?.count ?? 0} სკამზე · {s.roster.find((r) => r.slot === "IR")?.count ?? 0} IR
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {s.roster.map((r) => (
              <div key={r.slot} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2" title={SLOT_KA[r.slot]}>
                <span className="font-mono text-sm font-semibold">{r.slot}</span>
                <span className="text-xs text-muted-foreground">×{r.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" /> ლიგის პარამეტრები
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-white/5 text-sm">
            {(
              [
                ["გუნდები", s.teams],
                ["რეგულარული სეზონი", s.regular_season_weeks ? `${s.regular_season_weeks} კვირა` : null],
                ["პლეი-ოფი", s.playoff_teams ? `${s.playoff_teams} გუნდი · რაუნდი ${s.playoff_round_weeks ?? 1} კვირა` : null],
                ["Waiver", s.waiver_hours ? `${s.waiver_hours} საათი` : null],
                ["აყვანების ლიმიტი", s.acquisition_limit != null && s.acquisition_limit >= 0 ? s.acquisition_limit : "შეუზღუდავი"],
                ["ტრეიდის ვეტო", s.veto_votes ? `${s.veto_votes} ხმა` : null],
                ["ტრეიდების დედლაინი", s.trade_deadline ? new Date(s.trade_deadline).toLocaleDateString("en-GB") : "არ არის"],
                ["დრაფტი", s.draft_type ? `${s.draft_type === "SNAKE" ? "Snake" : s.draft_type}${s.pick_seconds ? ` · ${s.pick_seconds} წმ პიკზე` : ""}` : null],
              ] as const
            )
              .filter(([, v]) => v != null)
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
