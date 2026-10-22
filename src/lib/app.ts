import { useEffect, useState } from "react";

/** აპლიკაციად დაყენება (PWA). Chrome/Android-ზე ბრაუზერი თავად გვაძლევს "Install" ფანჯარას,
 *  iPhone-ზე მხოლოდ Safari-ს Share მენიუდან ყენდება, ამიტომ იქ ინსტრუქციას ვაჩვენებთ. */
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: PromptEvent | null = null;
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as PromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => void subs.delete(f);
  }, []);
  const installed = isStandalone();
  return {
    installed,
    /** Chrome/Android: ღილაკით პირდაპირ ყენდება */
    canPrompt: !installed && deferred != null,
    /** iPhone: ხელით, Share მენიუდან */
    ios: !installed && isIOS(),
    async prompt() {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice.catch(() => null);
      deferred = null;
      notify();
    },
  };
}
