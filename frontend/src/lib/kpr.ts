/** Simulasi KPR anuitas (PRD §7.7). Fungsi murni — diuji di kpr.test.ts. */
export interface KprInput {
  price: number;
  downPaymentPercent: number;
  tenorYears: number;
  annualInterestPercent: number;
  maxInstallmentToIncome?: number;
}

export interface KprResult {
  downPayment: number;
  loanAmount: number;
  monthlyInstallment: number;
  totalPayment: number;
  minimumIncome: number;
}

export function calculateKpr(input: KprInput): KprResult {
  const ratio = input.maxInstallmentToIncome ?? 0.3;
  const downPayment = Math.round((input.price * input.downPaymentPercent) / 100);
  const loanAmount = input.price - downPayment;
  const n = Math.max(1, Math.round(input.tenorYears * 12));
  const r = input.annualInterestPercent / 100 / 12;
  const monthly = r === 0 ? loanAmount / n : (loanAmount * r) / (1 - Math.pow(1 + r, -n));
  const monthlyInstallment = Math.round(monthly);
  return {
    downPayment,
    loanAmount,
    monthlyInstallment,
    totalPayment: Math.round(monthly * n),
    minimumIncome: Math.round(monthly / ratio),
  };
}
