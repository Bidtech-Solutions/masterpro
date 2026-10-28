import type { Locale } from "@/i18n/routing";

const intlLocale: Record<Locale, string> = { id: "id-ID", en: "en-US" };

/** Harga lengkap: "Rp 1.250.000.000" (id) / "IDR 1,250,000,000" (en). PRD WEB-G-05. */
export function formatPriceFull(value: number, locale: Locale): string {
  const n = new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 0 }).format(value);
  return locale === "id" ? `Rp ${n}` : `IDR ${n}`;
}

/** Harga ringkas: "Rp 1,25 M", "Rp 850 jt" (id) / "IDR 1.25B", "IDR 850M" (en). */
export function formatPriceShort(value: number, locale: Locale): string {
  const units =
    locale === "id"
      ? ([
          [1e12, " T"],
          [1e9, " M"],
          [1e6, " jt"],
          [1e3, " rb"],
        ] as const)
      : ([
          [1e12, "T"],
          [1e9, "B"],
          [1e6, "M"],
          [1e3, "K"],
        ] as const);
  const prefix = locale === "id" ? "Rp " : "IDR ";
  for (const [size, suffix] of units) {
    if (Math.abs(value) >= size) {
      const n = new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 2 }).format(value / size);
      return `${prefix}${n}${suffix}`;
    }
  }
  return formatPriceFull(value, locale);
}

/** Luas: "120 m²" / "120,5 m²". */
export function formatArea(value: number, locale: Locale): string {
  return `${new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 2 }).format(value)} m²`;
}
