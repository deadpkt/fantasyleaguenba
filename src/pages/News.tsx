import { useState } from "react";
import { ExternalLink, Megaphone, Newspaper, Stethoscope, Zap } from "lucide-react";
import type { Injury, NbaArticle, PlayerNews } from "@/types";
import { ago, useNews } from "@/lib/useNews";
import { useApi } from "@/lib/useApi";
import type { AnnouncementsData } from "@/types";
import { clean } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AnnouncementCard } from "@/components/league/announcement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { PlayerPhoto, TeamAvatar } from "@/components/league/team";

export function ArticleCard({ a, compact }: { a: NbaArticle; compact?: boolean }) {
  return (
    <a
      href={a.link ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border bg-card/85 transition-colors hover:border-white/20"
    >
      {a.image && (
        <div className={cn("overflow-hidden bg-muted", compact ? "aspect-[16/8]" : "aspect-video")}>
          <img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Newspaper className="h-3.5 w-3.5" /> ESPN · {ago(a.published)}
        </div>
        <div className="font-medium leading-snug">{a.headline}</div>
        {!compact && a.description && <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
        <span className="mt-auto flex items-center gap-1 pt-1 text-xs text-muted-foreground group-hover:text-foreground">
          სრულად <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}

function PlayerNewsRow({ n }: { n: PlayerNews }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex gap-3 py-3.5">
      <PlayerPhoto pid={n.pid} className="h-12 w-12 shrink-0 rounded-full border bg-muted" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{n.player}</span>
          {n.owner && (
            <Badge variant="outline" className="gap-1.5 border-white/15 py-0 font-normal">
              <TeamAvatar name={n.owner} size={14} badge={false} /> {clean(n.owner)}
            </Badge>
          )}
          <span>· {ago(n.published)}</span>
        </div>
        <div className="text-sm leading-snug">{n.headline}</div>
        {n.story && (
          <>
            {open && <p className="text-sm text-muted-foreground">{n.story}</p>}
            <button onClick={() => setOpen(!open)} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              {open ? "ნაკლები" : "ანალიზი"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InjuryRow({ i }: { i: Injury }) {
  const out = /out/i.test(i.status);
  return (
    <div className="flex gap-3 py-3">
      <PlayerPhoto pid={i.pid ?? undefined} className="h-10 w-10 shrink-0 rounded-full border bg-muted" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{i.player}</span>
          <Badge variant={out ? "loss" : "gold"}>{i.status}</Badge>
          {i.owner && (
            <Badge variant="outline" className="gap-1.5 border-white/15 font-normal">
              <TeamAvatar name={i.owner} size={14} badge={false} /> {clean(i.owner)}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{i.team}</div>
        {i.comment && <p className="text-sm text-muted-foreground">{i.comment}</p>}
      </div>
    </div>
  );
}

export default function News() {
  const state = useNews();
  const ann = useApi<AnnouncementsData>("/api/announcements");
  const annItems = ann.state.status === "ready" ? ann.state.data.items : [];
  const [nbaShown, setNbaShown] = useState(12);
  const [onlyLeague, setOnlyLeague] = useState(false);

  return (
    <>
      <PageHeader title="სიახლეები" description="ლიგის განცხადებები, NBA-ს სიახლეები, ფანტაზი-ცნობები მოთამაშეებზე და ტრავმები. ახლდება ავტომატურად." />
      {state.status === "loading" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      )}
      {state.status === "error" && <p className="text-sm text-loss">სიახლეები ვერ ჩაიტვირთა: {state.message}</p>}
      {state.status === "ready" && (
        <Tabs defaultValue="league">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="league" className="gap-1.5">
              <Megaphone className="h-3.5 w-3.5" /> ლიგა
            </TabsTrigger>
            <TabsTrigger value="nba" className="gap-1.5">
              <Newspaper className="h-3.5 w-3.5" /> NBA
            </TabsTrigger>
            <TabsTrigger value="fantasy" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" /> ფანტაზი
            </TabsTrigger>
            <TabsTrigger value="injuries" className="gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" /> ტრავმები
            </TabsTrigger>
          </TabsList>

          <TabsContent value="league" className="space-y-3">
            {annItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">განცხადებები ჯერ არ არის.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {annItems.map((a, i) => (
                  <AnnouncementCard key={a.id ?? i} a={a} index={i} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="nba">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.data.nba.slice(0, nbaShown).map((a) => (
                <ArticleCard key={a.headline} a={a} />
              ))}
            </div>
            {nbaShown < state.data.nba.length && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setNbaShown(nbaShown + 12)}>
                  მეტის ჩვენება
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fantasy">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-base">მოთამაშეების სიახლეები</CardTitle>
                <CardDescription>Rotowire · ESPN. ფანტაზი-ცნობები ლიგის მოთამაშეებზე — ბეჯზე ჩანს, ვის ჰყავს.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-white/5">
                {state.data.fantasy.map((n, i) => (
                  <PlayerNewsRow key={i} n={n} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="injuries">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
                <div className="space-y-1">
                  <CardTitle className="text-base">ტრავმების სია</CardTitle>
                  <CardDescription>NBA-ს ოფიციალური სია. ლიგის მოთამაშეები ზემოთაა.</CardDescription>
                </div>
                <Button size="sm" variant={onlyLeague ? "default" : "outline"} onClick={() => setOnlyLeague(!onlyLeague)}>
                  მხოლოდ ჩვენი
                </Button>
              </CardHeader>
              <CardContent className="divide-y divide-white/5">
                {state.data.injuries
                  .filter((i) => !onlyLeague || i.owner)
                  .map((i, k) => (
                    <InjuryRow key={k} i={i} />
                  ))}
                {onlyLeague && !state.data.injuries.some((i) => i.owner) && (
                  <p className="py-4 text-sm text-muted-foreground">ლიგის მოთამაშეებიდან დაშავებული არავინაა (ან დრაფტი ჯერ არ ყოფილა).</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
