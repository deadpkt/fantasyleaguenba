import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ShareButton({
  title,
  text,
  url,
  iconOnly = false,
  className,
}: {
  title: string;
  text: string;
  url?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const shareUrl = url ?? window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url: shareUrl });
      else await navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl}`);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") console.error("Share failed", error);
    }
  };
  return (
    <Button
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "sm"}
      className={cn(className)}
      onClick={share}
      aria-label={done ? "ლინკი დაკოპირდა" : "გაზიარება"}
      title={done ? "დაკოპირდა" : "გაზიარება"}
    >
      {done ? <Check /> : <Share2 />}
      {!iconOnly && (done ? "დაკოპირდა" : "გაზიარება")}
    </Button>
  );
}
