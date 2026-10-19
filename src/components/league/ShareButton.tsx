import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShareButton({ title, text }: { title: string; text: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    if (navigator.share) await navigator.share({ title, text, url: window.location.href });
    else await navigator.clipboard.writeText(`${title}\n${text}\n${window.location.href}`);
    setDone(true); window.setTimeout(() => setDone(false), 1800);
  };
  return <Button variant="outline" size="sm" onClick={share}>{done ? <Check /> : <Share2 />}{done ? "დაკოპირდა" : "გაზიარება"}</Button>;
}
