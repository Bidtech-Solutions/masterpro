/** Default simulasi KPR (PRD §7.7). [KONFIRMASI KLIEN] bunga/DP/tenor. */
export const kprDefaults = {
  downPaymentPercent: 20,
  tenorYears: 15,
  annualInterestPercent: 7.5,
  maxInstallmentToIncome: 0.3,
  ranges: {
    downPaymentPercent: { min: 0, max: 90, step: 5 },
    tenorYears: { min: 1, max: 30, step: 1 },
    annualInterestPercent: { min: 1, max: 20, step: 0.25 },
  },
} as const;
