import { useCallback, useEffect, useState } from "react";

type State<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

/** JSON endpoint; refreshMs > 0 — ავტომატური განახლება (გვერდი ღია რომ არის) */
export function useApi<T>(url: string, refreshMs = 0) {
  const [state, setState] = useState<State<T>>({ status: "loading" });

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState({ status: "loading" });
      try {
        const r = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
        const body = await r.json();
        if (!r.ok || body.error) throw new Error(body.error || `HTTP ${r.status}`);
        setState({ status: "ready", data: body as T });
      } catch (e) {
        if (!silent) setState({ status: "error", message: (e as Error).message });
      }
    },
    [url],
  );

  useEffect(() => {
    load();
    if (!refreshMs) return;
    const id = window.setInterval(() => document.visibilityState === "visible" && load(true), refreshMs);
    return () => window.clearInterval(id);
  }, [load, refreshMs]);

  return { state, reload: () => load(true) };
}
