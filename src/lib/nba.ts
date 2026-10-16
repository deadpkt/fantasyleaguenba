/** NBA-ს 30 გუნდი: ESPN-ის კოდი → სახელი და ოფიციალური ფერები */
export interface NbaTeam {
  name: string;
  primary: string;
  secondary: string;
}

export const NBA: Record<string, NbaTeam> = {
  atl: { name: "Atlanta Hawks", primary: "#E03A3E", secondary: "#C1D32F" },
  bos: { name: "Boston Celtics", primary: "#007A33", secondary: "#BA9653" },
  bkn: { name: "Brooklyn Nets", primary: "#1b1b1b", secondary: "#FFFFFF" },
  cha: { name: "Charlotte Hornets", primary: "#1D1160", secondary: "#00788C" },
  chi: { name: "Chicago Bulls", primary: "#CE1141", secondary: "#1b1b1b" },
  cle: { name: "Cleveland Cavaliers", primary: "#860038", secondary: "#FDBB30" },
  dal: { name: "Dallas Mavericks", primary: "#00538C", secondary: "#B8C4CA" },
  den: { name: "Denver Nuggets", primary: "#0E2240", secondary: "#FEC524" },
  det: { name: "Detroit Pistons", primary: "#C8102E", secondary: "#1D42BA" },
  gs: { name: "Golden State Warriors", primary: "#1D428A", secondary: "#FFC72C" },
  hou: { name: "Houston Rockets", primary: "#CE1141", secondary: "#C4CED4" },
  ind: { name: "Indiana Pacers", primary: "#002D62", secondary: "#FDBB30" },
  lac: { name: "LA Clippers", primary: "#C8102E", secondary: "#1D428A" },
  lal: { name: "Los Angeles Lakers", primary: "#552583", secondary: "#FDB927" },
  mem: { name: "Memphis Grizzlies", primary: "#5D76A9", secondary: "#12173F" },
  mia: { name: "Miami Heat", primary: "#98002E", secondary: "#F9A01B" },
  mil: { name: "Milwaukee Bucks", primary: "#00471B", secondary: "#EEE1C6" },
  min: { name: "Minnesota Timberwolves", primary: "#0C2340", secondary: "#78BE20" },
  no: { name: "New Orleans Pelicans", primary: "#0C2340", secondary: "#C8102E" },
  ny: { name: "New York Knicks", primary: "#006BB6", secondary: "#F58426" },
  okc: { name: "Oklahoma City Thunder", primary: "#007AC1", secondary: "#EF3B24" },
  orl: { name: "Orlando Magic", primary: "#0077C0", secondary: "#C4CED4" },
  phi: { name: "Philadelphia 76ers", primary: "#006BB6", secondary: "#ED174C" },
  phx: { name: "Phoenix Suns", primary: "#1D1160", secondary: "#E56020" },
  por: { name: "Portland Trail Blazers", primary: "#E03A3E", secondary: "#1b1b1b" },
  sac: { name: "Sacramento Kings", primary: "#5A2D81", secondary: "#63727A" },
  sa: { name: "San Antonio Spurs", primary: "#8A939B", secondary: "#1b1b1b" },
  tor: { name: "Toronto Raptors", primary: "#CE1141", secondary: "#1b1b1b" },
  utah: { name: "Utah Jazz", primary: "#002B5C", secondary: "#F9A01B" },
  wsh: { name: "Washington Wizards", primary: "#002B5C", secondary: "#E31837" },
};

export const nbaLogo = (abbr: string) => `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;
