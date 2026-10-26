import { Link } from "react-router-dom";
import { useData } from "@/lib/league";
import PageHeader from "@/components/layout/PageHeader";
import { RecapBoard } from "@/components/league/WeekRecap";

/** მიმდინარე სეზონის კვირის რეპორტაჟი (წინა სეზონები: ისტორია → რეპორტაჟები) */
export default function Recap() {
  const data = useData();
  const label = data.current.label;
  const week = data.current.week;
  // დასრულებული კვირები + მიმდინარე კვირა (წინასწარი ანგარიშით), თუ უკვე დაიწყო
  const games = data.current.schedule
    .filter((g) => g.done || (g.p === week && g.hs + g.as > 0))
    .map((g) => ({ p: g.p, h: g.h, a: g.a, hs: g.hs, as: g.as, po: false }));
  const liveWeek = data.current.schedule.some((g) => g.p === week && !g.done && g.hs + g.as > 0) ? week : undefined;

  return (
    <>
      <PageHeader title={`კვირის რეპორტაჟი · ${label}`} description="ყოველი კვირის მთავარი მომენტები: საუკეთესო, ყველაზე დიდი მოგება, ახლო მატჩი და კვირის ტაბლო." />
      {games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
          რეპორტაჟი პირველი კვირის დასრულების შემდეგ გამოჩნდება. მანამდე ანგარიში{" "}
          <Link to="/live" className="text-foreground underline underline-offset-4">
            Live-ზე
          </Link>{" "}
          ნახე. წინა სეზონების რეპორტაჟები{" "}
          <Link to="/archive" className="text-foreground underline underline-offset-4">
            ისტორიაშია
          </Link>
          .
        </div>
      ) : (
        <RecapBoard key={label} label={label} games={games} liveWeek={liveWeek} />
      )}
    </>
  );
}
