import { useData } from "@/lib/league";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { Team, TeamAvatar } from "@/components/league/team";

export default function HeadToHead() {
  const { h2h } = useData();
  const { teams, cells } = h2h;
  const keep = teams.map((_, i) => i).filter((i) => cells[i].some(([w, l]) => w + l > 0));

  return (
    <>
      <PageHeader title="Head to Head" description="მოგება–წაგება სტრიქონის გუნდის მხრიდან, ყველა სეზონი. ტელეფონზე ცხრილი გვერდზე სქროლდება." />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto p-3">
          <table className="border-separate border-spacing-1 text-sm tabular">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card" />
                {keep.map((j) => (
                  <th key={j} className="px-1 pb-1" title={clean(teams[j])}>
                    <div className="flex justify-center">
                      <TeamAvatar name={teams[j]} size={30} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keep.map((i) => (
                <tr key={i}>
                  <th className="sticky left-0 z-10 bg-card pr-3 text-left font-normal">
                    <Team name={teams[i]} className="w-36 sm:w-48" />
                  </th>
                  {keep.map((j) => {
                    if (i === j) return <td key={j}><div className="h-9 w-12 rounded-md bg-muted/40" /></td>;
                    const [w, l] = cells[i][j];
                    return (
                      <td key={j}>
                        <div
                          title={`${clean(teams[i])} vs ${clean(teams[j])}`}
                          className={cn(
                            "flex h-9 w-12 items-center justify-center rounded-md border text-xs font-medium",
                            !w && !l && "text-muted-foreground",
                            w > l && "border-win/30 bg-win/10 text-win",
                            w < l && "border-loss/30 bg-loss/10 text-loss",
                          )}
                        >
                          {!w && !l ? "–" : `${w}-${l}`}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
