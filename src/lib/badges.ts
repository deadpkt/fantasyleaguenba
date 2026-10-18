import type { LeagueData, Manager, PickRow } from "@/types";
import { plain } from "@/lib/format";

/** მიღწევა (ბეჯი) მენეჯერის პროფილზე */
export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  earned: boolean;
  /** gold / red / blue / win — ფერი; fun — "სამარცხვინო" ბეჯები */
  tier: "gold" | "red" | "blue" | "win" | "fun";
}

const same = (a: string, b: string) => plain(a) === plain(b);

/** ლიგის მონაცემებიდან ვითვლით, რომელი ბეჯი აქვს გუნდს. pick — პროგნოზების ცხრილის სტრიქონი (თუ ჩაიტვირთა). */
export function achievements(data: LeagueData, m: Manager, pick?: PickRow): Achievement[] {
  const at = data.alltime.filter((r) => r.seasons > 0);
  const mine = at.find((r) => same(r.team, m.team));
  const top = (k: "ppg" | "pct") => [...at].sort((a, b) => b[k] - a[k])[0];
  const rec = (part: string) => data.records.find((r) => r.k.includes(part));
  const holds = (part: string) => {
    const r = rec(part);
    return !!r && !r.who.includes(" vs ") && same(r.who, m.team);
  };
  const last = data.seasons.find((s) => s.complete);
  const lastTrades = data.trades?.past?.[0];
  const topTrader = lastTrades ? [...lastTrades.teams].sort((a, b) => b.trades - a.trades)[0] : undefined;

  // H2H: ვინმესთან +3 ან მეტი
  const { teams, cells } = data.h2h;
  const me = teams.findIndex((t) => same(t, m.team));
  const boss = me >= 0 && cells[me].some(([w, l], j) => j !== me && w - l >= 3);

  const list: Achievement[] = [
    { id: "champ", icon: "🏆", name: m.titles > 1 ? `${m.titles}× ჩემპიონი` : "ჩემპიონი", desc: "მოიგო ლიგის ტიტული", earned: m.titles > 0, tier: "gold" },
    { id: "finals", icon: "🥈", name: "ფინალისტი", desc: "ითამაშა ფინალში", earned: (mine?.finals ?? 0) > 0, tier: "gold" },
    { id: "playoffs", icon: "🎟️", name: "პლეიოფის ვეტერანი", desc: "პლეიოფში 2+ სეზონი", earned: m.playoffs >= 2, tier: "blue" },
    { id: "record", icon: "🔥", name: "რეკორდული კვირა", desc: "ლიგის ყველაზე მაღალი კვირის ქულა", earned: holds("მაღალი"), tier: "red" },
    { id: "streak", icon: "⚡", name: "დაუმარცხებელი", desc: "ყველაზე გრძელი მოგებების სერია", earned: holds("მოგებების"), tier: "win" },
    { id: "ppg", icon: "💪", name: "ქულების მანქანა", desc: "ყველა დროის საუკეთესო PPG", earned: !!mine && top("ppg") === mine, tier: "red" },
    { id: "pct", icon: "📊", name: "გამარჯვების ფორმულა", desc: "ყველა დროის საუკეთესო მოგების %", earned: !!mine && top("pct") === mine, tier: "win" },
    { id: "trader", icon: "🔁", name: "ტრეიდ-მასტერი", desc: "ყველაზე მეტი ტრეიდი გასულ სეზონში", earned: !!topTrader && topTrader.trades > 0 && same(topTrader.team, m.team), tier: "blue" },
    { id: "draft", icon: "🎯", name: "დრაფტის ოსტატი", desc: "გასული დრაფტის საუკეთესო Steal", earned: !!last?.draft?.steals[0] && same(last.draft.steals[0].team, m.team), tier: "win" },
    { id: "lucky", icon: "🍀", name: "იღბლიანი", desc: "ყველაზე იღბლიანი გასულ სეზონში", earned: !!last?.luck[0] && same(last.luck[0].name, m.team), tier: "gold" },
    { id: "boss", icon: "😤", name: "ვიღაცის ბატონი", desc: "ერთ-ერთ მოწინააღმდეგესთან H2H +3", earned: boss, tier: "red" },
    { id: "oracle", icon: "👑", name: "ორაკული", desc: "კვირის საუკეთესო პროგნოზი", earned: (pick?.oracle ?? 0) > 0, tier: "gold" },
    { id: "perfect", icon: "💯", name: "იდეალური კვირა", desc: "კვირის ყველა პროგნოზი სწორი", earned: (pick?.perfect ?? 0) > 0, tier: "win" },
    { id: "rookie", icon: "🐣", name: "ახალბედა", desc: "პირველი სეზონი ლიგაში", earned: m.rookie, tier: "blue" },
    // სამარცხვინო 😅
    { id: "cold", icon: "🧊", name: "ყინულის კვირა", desc: "ლიგის ყველაზე დაბალი კვირა", earned: holds("დაბალი"), tier: "fun" },
    { id: "slump", icon: "🥶", name: "შავი ზოლი", desc: "ყველაზე გრძელი წაგებების სერია", earned: holds("წაგებების"), tier: "fun" },
    { id: "unlucky", icon: "😭", name: "უიღბლო", desc: "ყველაზე უიღბლო გასულ სეზონში", earned: !!last?.luck.length && same(last.luck[last.luck.length - 1].name, m.team), tier: "fun" },
  ];
  // მიღებული — ზემოთ
  return [...list.filter((b) => b.earned), ...list.filter((b) => !b.earned)];
}
