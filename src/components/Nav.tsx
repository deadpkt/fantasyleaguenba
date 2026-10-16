const LINKS: [string, string][] = [
  ["story", "მთავარი"],
  ["managers", "მენეჯერები"],
  ["champions", "ჩემპიონები"],
  ["now", "ეს სეზონი"],
  ["alltime", "All-Time"],
  ["records", "რეკორდები"],
  ["seasons", "არქივი"],
  ["h2h", "H2H"],
];

export default function Nav({ season }: { season: string }) {
  return (
    <nav className="top">
      <div className="wrap">
        <a className="logo" href="#top">
          <b>W</b>WCF
        </a>
        {LINKS.map(([id, label]) => (
          <a key={id} className="l" href={`#${id}`}>
            {label}
          </a>
        ))}
        <span className="live-dot">
          <i />
          <span>{season}</span>
        </span>
      </div>
    </nav>
  );
}
