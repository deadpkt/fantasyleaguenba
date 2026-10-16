import { useData } from "@/lib/league";
import { fmt } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/layout/PageHeader";
import { Team } from "@/components/league/team";

export default function Standings() {
  const { current } = useData();
  return (
    <>
      <PageHeader
        title={`ცხრილი · ${current.label}`}
        description={current.drafted ? `კვირა ${current.week} · ახლდება ESPN-იდან ყოველ 10 წუთში` : "სეზონი ჯერ არ დაწყებულა. დრაფტის შემდეგ აქ ცოცხალი ცხრილი იქნება."}
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>გუნდი</TableHead>
              <TableHead className="text-right">W-L</TableHead>
              <TableHead className="text-right">PF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.standings.map((t, i) => (
              <TableRow key={t.name}>
                <TableCell className="text-muted-foreground">{current.drafted ? i + 1 : "–"}</TableCell>
                <TableCell>
                  <Team name={t.name} />
                </TableCell>
                <TableCell className="text-right">
                  {t.w}-{t.l}
                </TableCell>
                <TableCell className="text-right">{fmt(t.pf)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
