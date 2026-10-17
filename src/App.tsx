import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useLeague } from "@/lib/useLeague";
import { LeagueProvider } from "@/lib/league";
import { Skeleton } from "@/components/ui/skeleton";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import Backdrop from "@/components/layout/Backdrop";
import SiteFx, { PageTransition } from "@/components/layout/SiteFx";
import Home from "@/pages/Home";
import Managers from "@/pages/Managers";
import Standings from "@/pages/Standings";
import History from "@/pages/History";
import Records from "@/pages/Records";
import Seasons from "@/pages/Seasons";
import HeadToHead from "@/pages/HeadToHead";
import Rules from "@/pages/Rules";
import News from "@/pages/News";
import Live from "@/pages/Live";
import Trades from "@/pages/Trades";
import Announcements from "@/pages/Announcements";

/** გვერდის შეცვლისას თავში ავდივართ */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
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
          <SiteHeader league={state.data.league} season={state.data.current.label} />
          <main className="container relative z-10 min-h-[60vh]">
            <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/managers" element={<Managers />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/history" element={<History />} />
              <Route path="/records" element={<Records />} />
              <Route path="/seasons" element={<Seasons />} />
              <Route path="/h2h" element={<HeadToHead />} />
              <Route path="/news" element={<News />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/live" element={<Live />} />
              <Route path="/trades" element={<Trades />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </PageTransition>
          </main>
          <Footer league={state.data.league} updated={state.data.updated} />
        </LeagueProvider>
      )}
    </BrowserRouter>
  );
}
