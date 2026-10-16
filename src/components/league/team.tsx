import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { clean, hue, initials } from "@/lib/format";
import { headshot, useFan, useLogo } from "@/lib/logos";
import { NBA, nbaLogo } from "@/lib/nba";

/** გუნდის ავატარი: ESPN-ის ლოგო ან ინიციალები; კუთხეში — NBA გუნდი, რომელსაც გულშემატკივრობს */
export function TeamAvatar({ name, size = 28, badge = true, className }: { name: string; size?: number; badge?: boolean; className?: string }) {
  const logo = useLogo(name);
  const fan = useFan(name);
  const [broken, setBroken] = useState(false);
  const [fanBroken, setFanBroken] = useState(false);
  const h = hue(name);
  const b = Math.max(12, Math.round(size * 0.42));

  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      {logo && !broken ? (
        <img
          src={logo}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full rounded-md border bg-muted object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center rounded-md border font-semibold text-white"
          style={{ background: `hsl(${h} 45% 28%)`, fontSize: Math.round(size * 0.38) }}
        >
          {initials(name)}
        </span>
      )}
      {badge && fan && !fanBroken && size >= 24 && (
        <img
          src={nbaLogo(fan)}
          alt={NBA[fan]?.name ?? fan}
          title={NBA[fan] ? `${NBA[fan].name} fan` : undefined}
          loading="lazy"
          onError={() => setFanBroken(true)}
          className="absolute -bottom-1 -right-1 rounded-full border border-background bg-white object-contain p-[1px]"
          style={{ width: b, height: b }}
        />
      )}
    </span>
  );
}

/** ავატარი + სახელი (ცხრილებისთვის) */
export function Team({ name, children, className }: { name: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <TeamAvatar name={name} />
      <span className="truncate font-medium">{clean(name)}</span>
      {children}
    </div>
  );
}

/** NBA მოთამაშის ფოტო ESPN-იდან; თუ ვერ ჩაიტვირთა — არ ჩანს */
export function PlayerPhoto({ pid, className }: { pid?: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!pid || broken) return null;
  return <img src={headshot(pid)} alt="" loading="lazy" onError={() => setBroken(true)} className={cn("object-cover object-top", className)} />;
}
