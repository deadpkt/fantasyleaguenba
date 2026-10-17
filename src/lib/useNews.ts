import { useEffect, useState } from "react";
import type { NewsData } from "@/types";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: NewsData };

// ერთხელ ჩატვირთული სიახლეები გვერდებს შორის გადასვლისას ინახება
let cache: NewsData | null = null;
let pending: Promise<NewsData> | null = null;

function load(): Promise<NewsData> {
  if (cache) return Promise.resolve(cache);
  pending ??= fetch("/api/news", { headers: { accept: "application/json" } })
    .then(async (r) => {
      const body = await r.json();
      if (!r.ok || body.error) throw new Error(body.error || `HTTP ${r.status}`);
      cache = body as NewsData;
      return cache;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** /api/news — NBA სიახლეები, ფანტაზი-სიახლეები, ტრავმები, განცხადებები */
export function useNews(): State {
  const [state, setState] = useState<State>(cache ? { status: "ready", data: cache } : { status: "loading" });
  useEffect(() => {
    if (cache) return;
    let alive = true;
    load()
      .then((data) => alive && setState({ status: "ready", data }))
      .catch((e: Error) => alive && setState({ status: "error", message: e.message }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** "2 საათის წინ" */
export function ago(iso?: string): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} წუთის წინ`;
  if (s < 86400) return `${Math.round(s / 3600)} საათის წინ`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} დღის წინ`;
  return new Date(iso).toLocaleDateString("en-GB");
}
