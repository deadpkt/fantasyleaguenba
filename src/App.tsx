import { useLeague } from "./lib/useLeague";
import { clean } from "./lib/format";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Storylines from "./components/Storylines";
import Rafters from "./components/Rafters";
import CurrentStandings from "./components/CurrentStandings";
import AllTime from "./components/AllTime";
import RecordBook from "./components/RecordBook";
import Archive from "./components/Archive";
import HeadToHead from "./components/HeadToHead";
import Loader from "./components/Loader";

export default function App() {
  const state = useLeague();

  if (state.status !== "ready") {
    return <Loader error={state.status === "error" ? state.message : undefined} />;
  }

  const data = state.data;
  return (
    <>
      <Nav season={data.current.label} />
      <Hero data={data} />
      <main className="wrap">
        <Storylines data={data} />
        <Rafters league={data.league} champions={data.champions} nextSeason={data.current.label} />
        <CurrentStandings current={data.current} />
        <AllTime rows={data.alltime} />
        <RecordBook records={data.records} />
        <Archive seasons={data.seasons} />
        <HeadToHead h2h={data.h2h} />
        <footer>
          <span>
            განახლდა {data.updated} · {clean(data.league)}
          </span>
          <span>მონაცემები: ESPN Fantasy Basketball</span>
        </footer>
      </main>
    </>
  );
}
