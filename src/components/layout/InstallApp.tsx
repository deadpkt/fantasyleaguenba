import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { useInstall } from "@/lib/app";

const DISMISS_KEY = "wcf-install-dismissed";

/** iPhone-ზე ღილაკით ვერ დავაყენებთ: ვაჩვენებთ ორ ნაბიჯს */
function IosSteps() {
  return (
    <ol className="space-y-2 text-sm">
      <li className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs">1</span>
        Safari-ში დააჭირე <Share className="h-4 w-4 shrink-0" /> ღილაკს ქვემოთ
      </li>
      <li className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs">2</span>
        აირჩიე <SquarePlus className="h-4 w-4 shrink-0" /> "Add to Home Screen"
      </li>
    </ol>
  );
}

/** მენიუში: "დააყენე აპი" (თუ უკვე დაყენებულია ან ბრაუზერი არ უჭერს მხარს, არ ჩანს) */
export function InstallMenuItem() {
  const app = useInstall();
  const [steps, setSteps] = useState(false);
  if (!app.canPrompt && !app.ios) return null;
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => (app.canPrompt ? app.prompt() : setSteps(!steps))}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
      >
        <Download className="h-4 w-4" /> დააყენე აპი
      </button>
      {steps && <IosSteps />}
    </div>
  );
}

/** ტელეფონზე, ერთხელ: ქვემოთ პატარა ბარათი. დახურვის შემდეგ აღარ ჩანს. */
export function InstallBanner() {
  const app = useInstall();
  const [show, setShow] = useState(false);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* private mode */
    }
    if (dismissed || window.innerWidth >= 768) return;
    const id = window.setTimeout(() => setShow(true), 4000);
    return () => window.clearTimeout(id);
  }, []);

  if (!show || (!app.canPrompt && !app.ios)) return null;

  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">WCF აპად</div>
            <p className="text-xs text-muted-foreground">დააყენე ტელეფონზე და გაიხსნება როგორც ჩვეულებრივი აპი.</p>
          </div>
          <button type="button" onClick={close} aria-label="დახურვა" className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {steps ? (
          <div className="mt-3 border-t border-white/10 pt-3">
            <IosSteps />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => (app.canPrompt ? app.prompt().then(close) : setSteps(true))}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-black"
          >
            <Download className="h-4 w-4" /> დააყენე
          </button>
        )}
      </div>
    </div>
  );
}
