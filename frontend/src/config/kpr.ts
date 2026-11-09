/** Default simulasi KPR (PRD §7.7). [KONFIRMASI KLIEN] bunga/DP/tenor. */
export const kprDefaults = {
  downPaymentPercent: 20,
  tenorYears: 15,
  annualInterestPercent: 7.5,
  maxInstallmentToIncome: 0.3,
  /** Harga awal bila listing tidak memiliki harga valid. */
  fallbackPrice: 1_250_000_000,
  minPrice: 10_000_000,
  ranges: {
    downPaymentPercent: { min: 0, max: 90, step: 5 },
    tenorYears: { min: 1, max: 30, step: 1 },
    annualInterestPercent: { min: 1, max: 20, step: 0.25 },
  },
  /** Pilihan tenor (tahun) di kalkulator detail properti (WEB-D-07). */
  tenorOptions: [5, 10, 15, 20, 25, 30],
} as const;
