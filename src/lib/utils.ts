import type * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ბარათის აქცენტის ფერი (index.css-ის .tone-card): gold | red | blue | win */
export const tone = (v: "gold" | "red" | "blue" | "win") => ({ "--tone": `var(--${v})` }) as React.CSSProperties;
