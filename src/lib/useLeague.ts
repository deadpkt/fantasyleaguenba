import { useEffect, useState } from "react";
import type { LeagueData } from "../types";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: LeagueData };

/** ლიგის მონაცემები /api/data-დან (ESPN → Vercel-ის ფუნქცია) */
export function useLeague(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    fetch("/api/data", { headers: { accept: "application/json" } })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || body.error) throw new Error(body.error || `HTTP ${r.status}`);
        return body as LeagueData;
      })
      .then((data) => alive && setState({ status: "ready", data }))
      .catch((e: Error) => alive && setState({ status: "error", message: e.message }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
