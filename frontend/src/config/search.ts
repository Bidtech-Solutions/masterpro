/** Preset pencarian hero Beranda (PRD WEB-H-01, desain Stitch). */
export const priceRanges = [
  { value: "lt500m", label: { id: "< Rp 500 Jt", en: "< IDR 500M" }, max: 500_000_000 },
  {
    value: "500m-2b",
    label: { id: "Rp 500 Jt – Rp 2 M", en: "IDR 500M – 2B" },
    min: 500_000_000,
    max: 2_000_000_000,
  },
  {
    value: "2b-5b",
    label: { id: "Rp 2 M – Rp 5 M", en: "IDR 2B – 5B" },
    min: 2_000_000_000,
    max: 5_000_000_000,
  },
  { value: "gt5b", label: { id: "> Rp 5 M", en: "> IDR 5B" }, min: 5_000_000_000 },
] as const satisfies ReadonlyArray<{
  value: string;
  label: { id: string; en: string };
  min?: number;
  max?: number;
}>;

export type PriceRangeValue = (typeof priceRanges)[number]["value"];

/** Jumlah item carousel Beranda (WEB-H-02/03). */
export const homeCarouselSize = 10;

/** Item per halaman katalog (WEB-P-06). */
export const catalogPageSize = 12;
