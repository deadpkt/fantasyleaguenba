import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useLeague } from "@/lib/useLeague";
import { LeagueProvider } from "@/lib/league";
import { Skeleton } from "@/components/ui/skeleton";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import Backdrop from "@/components/layout/Backdrop";
import SiteFx, { PageTransition } from "@/components/layout/SiteFx";
import Home from "@/pages/Home";

/** გვერდები ცალკე ფაილებად იტვირთება, როცა საჭიროა (პირველი გახსნა უფრო სწრაფია).
 *  ახალი deploy-ის შემდეგ ძველი ფაილი შეიძლება აღარ არსებობდეს: მაშინ გვერდს ერთხელ ვანახლებთ. */
function page(load: () => Promise<{ default: ComponentType }>) {
  return lazy(() =>
    load().catch((e) => {
      const k = "wcf-chunk-reload";
      let tried = false;
      try {
        tried = sessionStorage.getItem(k) === "1";
        sessionStorage.setItem(k, "1");
      } catch {
        /* private mode */
      }
      if (!tried) window.location.reload();
      throw e;
    }),
  );
}

const Managers = page(() => import("@/pages/Managers"));
const Standings = page(() => import("@/pages/Standings"));
const History = page(() => import("@/pages/History"));
const Records = page(() => import("@/pages/Records"));
const Seasons = page(() => import("@/pages/Seasons"));
const HeadToHead = page(() => import("@/pages/HeadToHead"));
const Live = page(() => import("@/pages/Live"));
const Trades = page(() => import("@/pages/Trades"));
const Announcements = page(() => import("@/pages/Announcements"));
const TeamProfile = page(() => import("@/pages/TeamProfile"));
const Player = page(() => import("@/pages/Player"));
const Recap = page(() => import("@/pages/Recap"));
const Trophies = page(() => import("@/pages/Trophies"));
const Odds = page(() => import("@/pages/Odds"));
const Analytics = page(() => import("@/pages/Analytics"));
const DraftGrades = page(() => import("@/pages/DraftGrades"));
const Stats = page(() => import("@/pages/Stats"));
import SubNav from "@/components/layout/SubNav";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

/** შეცდომის ჩარჩო, რომელიც გვერდის შეცვლისას თავიდან ცდის */
function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

/** გვერდის შეცვლისას თავში ავდივართ */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageSkeleton() {
  return (
    <div className="space-y-6 pt-10 md:pt-14">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="h-64" />
    </div>
  );
}

function Loading({ error }: { error?: string }) {
  return (
    <div className="container relative z-10 space-y-6 py-10">
      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm">
          <div className="font-medium">მონაცემები ვერ ჩაიტვირთა ESPN-იდან.</div>
          <div className="mt-1 text-muted-foreground">{error}</div>
        </div>
      ) : (
        <>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const state = useLeague();

  return (
    <BrowserRouter>
      <ScrollTop />
      <Backdrop />
      <SiteFx />
      {state.status !== "ready" ? (
        <>
          <SiteHeader league="wolt channel" season="" />
          <Loading error={state.status === "error" ? state.message : undefined} />
        </>
      ) : (
        <LeagueProvider data={state.data}>
          <SiteHeader league={state.data.league} season={state.data.current.label} data={state.data} />
          <main className="container relative z-10 min-h-[60vh]">
            <SubNav />
            <RouteErrorBoundary>
            <PageTransition>
            <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/managers" element={<Managers />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/history" element={<History />} />
              <Route path="/records" element={<Records />} />
              <Route path="/seasons" element={<Seasons />} />
              <Route path="/h2h" element={<HeadToHead />} />
              <Route path="/live" element={<Live />} />
              <Route path="/trades" element={<Trades />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/team/:tid" element={<TeamProfile />} />
              <Route path="/player/:pid" element={<Player />} />
              <Route path="/odds" element={<Odds />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/draft-grades" element={<DraftGrades />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/recap" element={<Recap />} />
              <Route path="/trophies" element={<Trophies />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
            </PageTransition>
            </RouteErrorBoundary>
          </main>
          <Footer league={state.data.league} updated={state.data.updated} />
        </LeagueProvider>
      )}
    </BrowserRouter>
  );
}
