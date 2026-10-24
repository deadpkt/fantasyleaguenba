import { clean } from "@/lib/format";

export default function Footer({ league, updated }: { league: string; updated: string }) {
  return (
    <footer className="relative z-10 mt-16 border-t bg-background">
      <div className="container flex flex-col gap-1 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <span>
          {clean(league)} · განახლდა {updated}
        </span>
        <span>მონაცემები: ESPN Fantasy Basketball</span>
      </div>
    </footer>
  );
}
