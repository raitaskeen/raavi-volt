import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const pkr = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** Formats whole rupees, e.g. 12500 → "Rs 12,500". */
export function formatPKR(amount: number) {
  return `Rs ${pkr.format(amount)}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Public URL for an R2 object key (or pass-through for absolute paths). */
export function mediaUrl(key: string) {
  return key.startsWith("/") || key.startsWith("http") ? key : `/media/${key}`;
}

export function formatDate(epochSeconds: number) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date(epochSeconds * 1000));
}
