import { useCallback, useEffect, useState } from "react";
import type { LeagueData } from "../types";
import { normalizeLeague } from "./normalize";

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
      const data = normalizeLeague(body as LeagueData);
      setState({ status: "ready", data });
      // CDN-მა შეიძლება ძველი ასლი მოგვცეს და ფონზე განაახლოს: მაშინ რამდენიმე წამში ახალს ვიღებთ
      const age = data.updated_at ? Date.now() - new Date(data.updated_at).getTime() : 0;
      if (!silent && age > 45_000) window.setTimeout(() => load(true), 6_000);
    } catch (e) {
      if (!silent) setState({ status: "error", message: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => document.visibilityState === "visible" && load(true);
    const id = window.setInterval(refresh, 45_000);
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
