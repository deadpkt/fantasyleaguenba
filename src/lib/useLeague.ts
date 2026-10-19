import { useCallback, useEffect, useState } from "react";
import type { LeagueData } from "../types";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: LeagueData };

/** ლიგის მონაცემები /api/data-დან (ESPN → Vercel-ის ფუნქცია) */
export function useLeague(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async (silent = false) => {
    try {
      const r = await fetch("/api/data", { headers: { accept: "application/json" }, cache: "no-store" });
      const body = await r.json();
      if (!r.ok || body.error) throw new Error(body.error || `HTTP ${r.status}`);
      setState({ status: "ready", data: body as LeagueData });
    } catch (e) {
      if (!silent) setState({ status: "error", message: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => document.visibilityState === "visible" && load(true);
    const id = window.setInterval(refresh, 10 * 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  return state;
}
