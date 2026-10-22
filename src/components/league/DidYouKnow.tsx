import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "@/lib/league";
import { clean, fmt } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Fact = { icon: string; label: string; text: ReactNode };

/** ფაქტები ლიგის ისტორიიდან — All-Time, H2H და რეკორდები */
function useFacts(): Fact[] {
  const data = useData();
  const b = (x: ReactNode) => <span className="font-semibold text-foreground">{x}</span>;
  const out: Fact[] = [];
  const at = data.alltime.filter((r) => r.seasons > 0);
  const top = <K extends keyof (typeof at)[number]>(k: K) => [...at].sort((x, y) => Number(y[k]) - Number(x[k]))[0];

  const titles = top("titles");
  if (titles?.titles)
    out.push({
      icon: "🏆",
      label: "დინასტია",
      text: (
        <>
          {b(clean(titles.team))} ლიგაში ყველაზე მეტი ტიტული აქვს: {b(titles.titles)} ({titles.titles_y.join(", ")}).
        </>
      ),
    });
  const pct = top("pct");
  if (pct)
    out.push({
      icon: "📊",
      label: "All-Time",
      text: (
        <>
          ყველა დროის საუკეთესო მოგების % {b(clean(pct.team))}-ს აქვს: {b(`${(pct.pct * 100).toFixed(1)}%`)} ({pct.w}-{pct.l}).
        </>
      ),
    });
  const ppg = top("ppg");
  if (ppg)
    out.push({
      icon: "🔥",
      label: "შეტევა",
      text: (
        <>
          {b(clean(ppg.team))} საშუალოდ {b(fmt(Math.round(ppg.ppg)))} ქულას აგროვებს კვირაში. ლიგაში ყველაზე მეტს.
        </>
      ),
    });
  const po = top("playoffs");
  if (po?.playoffs)
    out.push({
      icon: "🎟️",
      label: "პლეიოფი",
      text: (
        <>
          {b(clean(po.team))} პლეიოფში {b(po.playoffs)}-ჯერ მოხვდა {po.seasons} სეზონიდან.
        </>
      ),
    });

  // H2H: ყველაზე ცალმხრივი და ყველაზე ხშირი დაპირისპირება
  const { teams, cells } = data.h2h;
  type Pair = [number, number, number, number];
  let lop: Pair | null = null;
  let most: Pair | null = null;
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      const [w, l] = cells[i][j];
      if (i === j || w + l < 3) continue;
      if (!lop || w - l > lop[2] - lop[3]) lop = [i, j, w, l];
      if (i < j && (!most || w + l > most[2] + most[3])) most = [i, j, w, l];
    }
  }
  if (lop) {
    const [i, j, w, l] = lop;
    out.push({
      icon: "😤",
      label: "ბატონი და მსახური",
      text: (
        <>
          {b(clean(teams[i]))} {b(clean(teams[j]))}-ს ფლობს: H2H-ში {b(`${w}-${l}`)}.
        </>
      ),
    });
  }
  if (most) {
    const [i, j, w, l] = most;
    out.push({
      icon: "⚔️",
      label: "მთავარი დაპირისპირება",
      text: (
        <>
          {b(clean(teams[i]))} და {b(clean(teams[j]))} {b(w + l)}-ჯერ შეხვდნენ, ანგარიში {w}-{l}.
        </>
      ),
    });
  }
  for (const r of data.records.slice(0, 4))
    out.push({
      icon: "📌",
      label: "რეკორდი",
      text: (
        <>
          {r.k}: {b(r.v)}, {clean(r.who)}
          {r.when ? ` (${r.when})` : ""}.
        </>
      ),
    });
  return out;
}

const FACT_MS = 7000;

/** "იცოდი?" — ფაქტები თავისით იცვლება, მაუსზე ჩერდება */
export default function DidYouKnow() {
  const facts = useFacts();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || facts.length < 2) return;
    const id = window.setTimeout(() => setI((x) => (x + 1) % facts.length), FACT_MS);
    return () => window.clearTimeout(id);
  }, [i, paused, facts.length]);
  if (!facts.length) return null;
  const f = facts[i % facts.length];
  const go = (d: number) => setI((x) => (x + d + facts.length) % facts.length);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">იცოდი?</h2>
        <p className="text-sm text-muted-foreground">ფაქტები ლიგის ისტორიიდან</p>
      </div>
      <Card className="tone-card overflow-hidden" style={tone("blue")} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="flex items-center gap-4 p-5 sm:gap-6 sm:p-7">
          <div
            key={`i${i}`}
            className="fact-in grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl sm:h-16 sm:w-16 sm:text-4xl"
          >
            {f.icon}
          </div>
          <div key={`t${i}`} className="fact-in min-w-0 flex-1 space-y-1" style={{ animationDelay: "60ms" }}>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--blue))]">{f.label}</div>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{f.text}</p>
          </div>
          <div className="hidden shrink-0 gap-1 sm:flex">
            <Button variant="ghost" size="icon" aria-label="წინა" onClick={() => go(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" aria-label="შემდეგი" onClick={() => go(1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-5 pb-4 sm:px-7">
          {facts.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`ფაქტი ${k + 1}`}
              onClick={() => setI(k)}
              className={cn(
                "relative h-1 overflow-hidden rounded-full bg-white/10 transition-all duration-300",
                k === i % facts.length ? "w-10" : "w-3 hover:bg-white/25",
              )}
            >
              {k === i % facts.length && (
                <span
                  key={i}
                  className="fact-bar absolute inset-0 origin-left bg-[hsl(var(--blue))]"
                  style={{ animationDuration: `${FACT_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                />
              )}
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}

