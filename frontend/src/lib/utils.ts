import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Ukuran font kustom dari @theme (globals.css) — harus didaftarkan agar tidak dianggap warna oleh tailwind-merge. */
const fontSizes = [
  "display",
  "display-mobile",
  "h1",
  "h2",
  "h3",
  "price-lg",
  "price",
  "body-lg",
  "body",
  "body-sm",
  "caption",
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: fontSizes }] } },
});

/** Gabungkan class Tailwind tanpa konflik (konvensi shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
