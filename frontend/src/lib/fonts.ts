import { Inter, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";

/** Font brand (DESIGN.md §3, §0). Variabel CSS dipakai token @theme di globals.css. */
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${jakarta.variable} ${playfair.variable}`;
