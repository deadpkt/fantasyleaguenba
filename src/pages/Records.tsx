import { useData } from "@/lib/league";
import { clean } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { cn, tone } from "@/lib/utils";

const TONES = ["blue", "red", "gold", "win"] as const;
const TEXT = { blue: "text-[hsl(var(--blue))]", red: "text-[hsl(var(--red))]", gold: "text-gold", win: "text-win" };
import { TeamAvatar } from "@/components/league/team";

export default function Records() {
  const { records } = useData();
  return (
    <>
      <PageHeader title="რეკორდები" description="ლიგის ისტორიის რიცხვები, რომლებიც ჯერ არავის გაუტეხია." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {records.map((r, i) => {
          const t = TONES[i % TONES.length];
          const first = clean(r.who).split(" vs ")[0];
          return (
            <Card key={r.k} className="tone-card lift" style={tone(t)}>
              <CardHeader className="pb-2">
                <CardDescription>{r.k}</CardDescription>
                <CardTitle className={cn("text-4xl tabular", TEXT[t])}>{r.v}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TeamAvatar name={first} size={22} badge={false} />
                  <span className="truncate">{clean(r.who)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{r.when}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
