import { useEffect, useState } from "react";

/** "ჩემი გუნდი": მენეჯერი ერთხელ ირჩევს თავის გუნდს, საიტი მასზე ეწყობა.
 *  ინახება ამ ბრაუზერში; ყველა კომპონენტი ერთდროულად ახლდება (და სხვა ჩანართებშიც). */
const KEY = "wcf-my-team";
const subs = new Set<(tid: number | null) => void>();

const read = (): number | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};

export function setMyTeam(tid: number | null) {
  try {
    if (tid == null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(tid));
  } catch {
    /* private mode */
  }
  subs.forEach((f) => f(tid));
}

export function useMyTeam(): number | null {
  const [tid, setTid] = useState(read);
  useEffect(() => {
    subs.add(setTid);
    const onStorage = (e: StorageEvent) => e.key === KEY && setTid(read());
    window.addEventListener("storage", onStorage);
    return () => {
      subs.delete(setTid);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return tid;
}
