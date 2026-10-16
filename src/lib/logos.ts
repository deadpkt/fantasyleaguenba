import { createContext, useContext } from "react";
import { clean } from "./format";

export interface Assets {
  /** გუნდის სახელი → ESPN-ის ლოგო/ფოტო */
  logos: Record<string, string>;
  /** გუნდის სახელი → NBA გუნდი, რომელსაც მენეჯერი გულშემატკივრობს */
  fans: Record<string, string>;
}

export const AssetsContext = createContext<Assets>({ logos: {}, fans: {} });

/** ESPN-ზე ატვირთული (დახურული) სურათები ჩვენი /api/logo-თი მოდის */
export const espnImage = (url: string) =>
  url.startsWith("https://mystique-api.fantasy.espn.com/") ? `/api/logo?u=${encodeURIComponent(url)}` : url;

export function useLogo(name: string): string | null {
  const url = useContext(AssetsContext).logos[clean(name)];
  return url ? espnImage(url) : null;
}

export function useFan(name: string): string | null {
  return useContext(AssetsContext).fans[clean(name)] ?? null;
}

/** NBA მოთამაშის ოფიციალური ფოტო ESPN-დან */
export const headshot = (pid: number) => `https://a.espncdn.com/i/headshots/nba/players/full/${pid}.png`;
