import { createContext, useContext, type ReactNode } from "react";
import type { LeagueData } from "@/types";
import { AssetsContext } from "./logos";

const LeagueContext = createContext<LeagueData | null>(null);

/** ლიგის მონაცემები ნებისმიერ გვერდზე */
export function useData(): LeagueData {
  const d = useContext(LeagueContext);
  if (!d) throw new Error("LeagueProvider is missing");
  return d;
}

export function LeagueProvider({ data, children }: { data: LeagueData; children: ReactNode }) {
  return (
    <LeagueContext.Provider value={data}>
      <AssetsContext.Provider value={{ logos: data.logos ?? {}, fans: data.fans ?? {} }}>{children}</AssetsContext.Provider>
    </LeagueContext.Provider>
  );
}
