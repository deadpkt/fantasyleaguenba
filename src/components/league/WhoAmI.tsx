import { useEffect, useState, type FormEvent } from "react";
import { LogOut } from "lucide-react";
import { clean } from "@/lib/format";
import { cn, tone } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamAvatar } from "@/components/league/team";

/** მენეჯერის "შესვლა" — გუნდი + PIN. ერთი და იგივე პროგნოზებში, გამოკითხვებსა და ტრეშ-თოქში. */
export type Me = { tid: number; pin: string };
const ME_KEY = "wcf-pick-me";
const EVT = "wcf-me";

export function readMe(): Me | null {
  try {
    const v = JSON.parse(localStorage.getItem(ME_KEY) || "null");
    return v && typeof v.tid === "number" && typeof v.pin === "string" ? v : null;
  } catch {
    return null;
  }
}

export function writeMe(me: Me | null) {
  try {
    if (me) localStorage.setItem(ME_KEY, JSON.stringify(me));
    else localStorage.removeItem(ME_KEY);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(EVT));
}

/** მიმდინარე მენეჯერი — ყველა კომპონენტში სინქრონულად */
export function useMe() {
  const [me, setMe] = useState<Me | null>(readMe);
  useEffect(() => {
    const on = () => setMe(readMe());
    window.addEventListener(EVT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVT, on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return [me, writeMe] as const;
}

/** PIN-ის შემოწმება (პირველად — დაყენება). აბრუნებს ჩემს პროგნოზებს. */
export async function login(me: Me) {
  const r = await fetch("/api/pickem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", ...me }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error || `HTTP ${r.status}`);
  return d as { ok: true; picks: Record<string, Record<string, number>> };
}

type T = { tid: number; name: string; has_pin?: boolean };

export function WhoAmI({ teams, onLogin, hint }: { teams: T[]; onLogin?: (picks: Record<string, Record<string, number>>) => void; hint?: string }) {
  const [tid, setTid] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const team = teams.find((t) => t.tid === tid);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (tid == null) return;
    setBusy(true);
    setErr("");
    try {
      const d = await login({ tid, pin });
      writeMe({ tid, pin });
      onLogin?.(d.picks);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="tone-card" style={tone("blue")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">ვინ ხარ?</CardTitle>
        <CardDescription>{hint ?? "აირჩიე შენი გუნდი და შეიყვანე PIN. პირველად რასაც ჩაწერ, ის დარჩება შენს PIN-ად."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {teams.map((t) => (
            <button
              key={t.tid}
              type="button"
              onClick={() => setTid(t.tid)}
              title={clean(t.name)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-2 transition-all duration-200",
                tid === t.tid ? "border-[hsl(var(--blue))]/60 bg-[hsl(var(--blue))]/15" : "border-white/10 hover:border-white/25 hover:bg-white/[0.04]",
              )}
            >
              <TeamAvatar name={t.name} size={36} badge={false} />
              <span className="w-full truncate text-[10px] text-muted-foreground">{clean(t.name)}</span>
            </button>
          ))}
        </div>
        {team && (
          <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
            <Input
              id="me-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              placeholder={team.has_pin === false ? "მოიფიქრე PIN (4–8 ციფრი)" : "შენი PIN (პირველად მოიფიქრე)"}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-60"
              autoFocus
            />
            <Button type="submit" disabled={busy || pin.length < 4}>
              {team.has_pin === false ? "PIN-ის დაყენება" : "შესვლა"}
            </Button>
            {err && <span className="text-sm text-loss">{err}</span>}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/** "შესული ხარ როგორც …" + გასვლა */
export function MeChip({ name, onLogout }: { name: string; onLogout?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 text-sm">
        <TeamAvatar name={name} size={24} badge={false} /> {clean(name)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="გასვლა"
        onClick={() => {
          writeMe(null);
          onLogout?.();
        }}
      >
        <LogOut />
      </Button>
    </div>
  );
}
