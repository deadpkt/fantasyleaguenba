import { useState, type FormEvent } from "react";
import { KeyRound, LogOut, Pin, PinOff, Send, Trash2 } from "lucide-react";
import type { AnnouncementsData } from "@/types";
import { useApi } from "@/lib/useApi";
import { cn, tone } from "@/lib/utils";
import { AnnouncementCard, Ball, ShotScene } from "@/components/league/announcement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";

const PW_KEY = "wcf-admin";
const readPw = () => {
  try {
    return sessionStorage.getItem(PW_KEY) || "";
  } catch {
    return "";
  }
};

async function call(body: Record<string, unknown>) {
  const r = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export default function Announcements() {
  const { state, reload } = useApi<AnnouncementsData>("/api/announcements");
  const [pw, setPw] = useState(readPw);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const admin = Boolean(pw);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await call({ password: pwInput, action: "login" });
      setPw(pwInput);
      try {
        sessionStorage.setItem(PW_KEY, pwInput);
      } catch {
        /* private mode */
      }
      setLoginOpen(false);
      setPwInput("");
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    setPw("");
    try {
      sessionStorage.removeItem(PW_KEY);
    } catch {
      /* noop */
    }
  };

  const act = async (body: Record<string, unknown>, okText: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await call({ password: pw, ...body });
      setMsg({ ok: true, text: okText });
      window.setTimeout(() => setMsg((m) => (m?.ok ? null : m)), 3500);
      await reload();
      return true;
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await act({ action: "add", title, text, pinned }, "განცხადება გამოქვეყნდა 🏀")) {
      setTitle("");
      setText("");
      setPinned(false);
    }
  };

  const data = state.status === "ready" ? state.data : null;

  return (
    <>
      <PageHeader title="განცხადებები" description="კომისრის განცხადებები ლიგისთვის. ავტომატური შეხსენებები (დრაფტი, დედლაინები) ESPN-იდან ემატება.">
        {admin ? (
          <Button variant="outline" size="sm" className="bg-transparent" onClick={logout}>
            <LogOut /> გასვლა
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="bg-transparent" onClick={() => setLoginOpen(!loginOpen)}>
            <KeyRound /> კომისარი
          </Button>
        )}
      </PageHeader>

      {/* კომისრის ტრიბუნა */}
      <Card className="tone-card mb-6 overflow-hidden" style={tone("red")}>
        <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Ball className="h-3.5 w-3.5" /> კომისარი
            </div>
            <div className="text-xl font-semibold tracking-tight sm:text-2xl">ლიგის განცხადებები</div>
            {data && (
              <div className="flex gap-5 pt-1 font-mono text-sm">
                <span>
                  <span className="text-lg font-bold text-orange-400">{data.items.filter((a) => !a.auto).length}</span>{" "}
                  <span className="text-muted-foreground">განცხადება</span>
                </span>
                <span>
                  <span className="text-lg font-bold text-gold">{data.items.filter((a) => a.pinned).length}</span>{" "}
                  <span className="text-muted-foreground">მიმაგრებული</span>
                </span>
              </div>
            )}
          </div>
          <ShotScene className="hidden scale-90 sm:block md:scale-100" />
          <div className="h-[62px] w-[123px] shrink-0 sm:hidden">
            <ShotScene className="origin-top-left scale-[0.55]" />
          </div>
        </div>
      </Card>

      {msg && (
        <div
          className={cn(
            "mb-4 flex items-center gap-3 rounded-lg border p-3 text-sm animate-in fade-in-0 slide-in-from-top-2",
            msg.ok ? "border-orange-500/30 bg-orange-500/10 text-orange-200" : "border-loss/30 bg-loss/10 text-loss",
          )}
        >
          {msg.ok && <Ball className="dribble h-5 w-5" />}
          {msg.ok && <span className="font-mono font-bold tracking-widest text-orange-400">SWISH!</span>}
          {msg.text}
        </div>
      )}

      {/* შესვლა */}
      {!admin && loginOpen && (
        <Card className="mb-6 max-w-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">კომისრის შესვლა</CardTitle>
            <CardDescription>პაროლი Vercel-ის ADMIN_PASSWORD ცვლადშია.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={login} className="flex gap-2">
              <Input id="admin-pw" type="password" placeholder="პაროლი" value={pwInput} onChange={(e) => setPwInput(e.target.value)} autoFocus />
              <Button type="submit" disabled={busy || !pwInput}>
                შესვლა
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ახალი განცხადება */}
      {admin && (
        <Card className="tone-card mb-6" style={tone("gold")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ball className="h-4 w-4" /> ახალი განცხადება
            </CardTitle>
            {data && !data.writable && (
              <CardDescription className="text-loss">შენახვა ჯერ არ მუშაობს. Vercel-ში Upstash Redis უნდა დაუკავშირო (იხ. README).</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <Input id="ann-title" placeholder="სათაური" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
              <Textarea id="ann-text" placeholder="ტექსტი (არასავალდებულო)" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input id="ann-pin" type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-amber-400" />
                  მიამაგრე ზემოთ
                </label>
                <Button type="submit" disabled={busy || !title.trim()}>
                  <Send /> გამოქვეყნება
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* სია */}
      {state.status === "loading" && (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}
      {state.status === "error" && <p className="text-sm text-loss">ვერ ჩაიტვირთა: {state.message}</p>}
      {data && (
        <div className="space-y-3">
          {data.items.length === 0 && <p className="text-sm text-muted-foreground">განცხადებები ჯერ არ არის.</p>}
          {data.items.map((a, i) => (
            <AnnouncementCard
              key={a.id ?? `${a.title}-${i}`}
              a={a}
              index={i}
              actions={
                admin &&
                !a.auto &&
                a.id && (
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" disabled={busy} aria-label="მიმაგრება" onClick={() => act({ action: "pin", id: a.id }, "განახლდა")}>
                      {a.pinned ? <PinOff /> : <Pin />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      aria-label="წაშლა"
                      className="text-loss hover:text-loss"
                      onClick={() => window.confirm(`წავშალო „${a.title}“?`) && act({ action: "delete", id: a.id }, "წაიშალა")}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
