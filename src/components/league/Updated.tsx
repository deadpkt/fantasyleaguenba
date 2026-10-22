import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** "განახლდა 20 წმ წინ" — თავისით ითვლის, მწვანე წერტილით */
export default function Updated({ at, className }: { at?: string | null; className?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, []);
  if (!at) return null;
  const s = Math.max(0, Math.round((now - new Date(at).getTime()) / 1000));
  const text = s < 60 ? `${Math.max(s, 1)} წმ წინ` : s < 3600 ? `${Math.round(s / 60)} წთ წინ` : `${Math.round(s / 3600)} სთ წინ`;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-win" />
      განახლდა {text}
    </span>
  );
}
