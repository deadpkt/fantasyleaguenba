import { useLeague } from "./lib/useLeague";
import { clean } from "./lib/format";
import { AssetsContext } from "./lib/logos";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Storylines from "./components/Storylines";
import Managers from "./components/Managers";
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
    <AssetsContext.Provider value={{ logos: data.logos ?? {}, fans: data.fans ?? {} }}>
      <Nav season={data.current.label} />
      <Hero data={data} />
      <main className="wrap">
        <Storylines data={data} />
        {data.managers?.length > 0 && <Managers managers={data.managers} />}
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
    </AssetsContext.Provider>
  );
}
