import { useState } from "react";
import { useData } from "@/lib/league";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import { RecapBoard } from "@/components/league/WeekRecap";

/** წინა სეზონების კვირის რეპორტაჟები (ისტორია) */
export default function RecapArchive() {
  const data = useData();
  const seasons = data.seasons.filter((s) => s.label !== data.current.label && s.games?.length).reverse();
  const [label, setLabel] = useState(seasons[0]?.label);
  const season = seasons.find((s) => s.label === label) ?? seasons[0];

  return (
    <>
      <PageHeader title="რეპორტაჟები" description="წინა სეზონების ყველა კვირა: ჯილდოები, კვირის ტაბლო და შედეგები." />
      {!season ? (
        <p className="text-sm text-muted-foreground">წინა სეზონები ჯერ არ არის.</p>
      ) : (
        <div className="space-y-5">
          {seasons.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {seasons.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setLabel(s.label)}
                  className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", s.label === season.label ? "border-white bg-white text-black" : "border-white/10 text-muted-foreground hover:text-foreground")}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <RecapBoard key={season.label} label={season.label} games={season.games} />
        </div>
      )}
    </>
  );
}
