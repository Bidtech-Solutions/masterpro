import { describe, expect, it } from "vitest";

import { calculateKpr } from "./kpr";

describe("calculateKpr", () => {
  it("menghitung cicilan anuitas (contoh desain: Rp 1,25 M, DP 20%, 15 th, 7,5%)", () => {
    const r = calculateKpr({
      price: 1_250_000_000,
      downPaymentPercent: 20,
      tenorYears: 15,
      annualInterestPercent: 7.5,
    });
    expect(r.downPayment).toBe(250_000_000);
    expect(r.loanAmount).toBe(1_000_000_000);
    expect(r.monthlyInstallment).toBe(9_270_124);
    expect(r.totalPayment).toBe(1_668_622_248);
    expect(r.minimumIncome).toBe(30_900_412);
  });

  it("bunga 0% → pokok dibagi rata", () => {
    const r = calculateKpr({
      price: 120_000_000,
      downPaymentPercent: 0,
      tenorYears: 1,
      annualInterestPercent: 0,
    });
    expect(r.monthlyInstallment).toBe(10_000_000);
  });
});
