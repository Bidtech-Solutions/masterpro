"use client";

import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { kprDefaults } from "@/config/kpr";
import { partners } from "@/config/partners";
import type { Locale } from "@/i18n/routing";
import { formatPriceFull } from "@/lib/format";
import { calculateKpr } from "@/lib/kpr";

interface Props {
  initialPrice: number;
}

const fieldLabel = "mb-2 block text-xs font-semibold text-slate-600";
const fieldInput =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-navy-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

/** Simulasi KPR detail properti (PRD WEB-D-07, rumus §7.7). Hanya dirender untuk listing jual. */
export function KprCalculatorCard({ initialPrice }: Props) {
  const t = useTranslations("propertyDetail");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const { ranges } = kprDefaults;

  const [price, setPrice] = useState<number>(initialPrice > 0 ? initialPrice : kprDefaults.fallbackPrice);
  const [dpPercent, setDpPercent] = useState<number>(kprDefaults.downPaymentPercent);
  const [tenorYears, setTenorYears] = useState<number>(kprDefaults.tenorYears);
  const [interestPercent, setInterestPercent] = useState<number>(kprDefaults.annualInterestPercent);

  const result = useMemo(
    () =>
      calculateKpr({
        price: Math.max(kprDefaults.minPrice, price),
        downPaymentPercent: dpPercent,
        tenorYears,
        annualInterestPercent: interestPercent,
        maxInstallmentToIncome: kprDefaults.maxInstallmentToIncome,
      }),
    [price, dpPercent, tenorYears, interestPercent],
  );

  const money = (v: number) => formatPriceFull(v, locale);
  const priceText = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(price);

  const breakdown = [
    { label: t("kprDownPaymentAmount"), value: money(result.downPayment) },
    { label: t("kprLoanPrincipal"), value: money(result.loanAmount) },
    { label: t("kprTotalPayment"), value: money(result.totalPayment) },
    { label: t("kprMinimumIncome"), value: money(result.minimumIncome) },
  ];

  return (
    <section
      aria-labelledby="kpr-title"
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Calculator className="size-5" aria-hidden />
        </div>
        <div>
          <h2 id="kpr-title" className="font-display text-xl font-bold text-navy-900">
            {t("kprTitle")}
          </h2>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">{t("kprSubtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:gap-8">
        {/* Input */}
        <div className="space-y-5">
          <div>
            <label htmlFor="kpr-price" className={fieldLabel}>
              {t("kprPropertyPrice")}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {locale === "id" ? "Rp" : "IDR"}
              </span>
              <input
                id="kpr-price"
                type="text"
                inputMode="numeric"
                value={priceText}
                onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, "")) || 0)}
                className={`${fieldInput} pr-4 ${locale === "id" ? "pl-10" : "pl-12"}`}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label htmlFor="kpr-dp" className="text-xs font-semibold text-slate-600">
                {t("kprDownPayment")}
              </label>
              <span className="text-sm font-bold text-navy-900">
                {dpPercent}%{" "}
                <span className="text-xs font-medium text-slate-500">· {money(result.downPayment)}</span>
              </span>
            </div>
            <input
              id="kpr-dp"
              type="range"
              min={ranges.downPaymentPercent.min}
              max={ranges.downPaymentPercent.max}
              step={ranges.downPaymentPercent.step}
              value={dpPercent}
              onChange={(e) => setDpPercent(Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>{ranges.downPaymentPercent.min}%</span>
              <span>{ranges.downPaymentPercent.max}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="kpr-tenor" className={fieldLabel}>
                {t("kprTenor")}
              </label>
              <select
                id="kpr-tenor"
                value={tenorYears}
                onChange={(e) => setTenorYears(Number(e.target.value))}
                className={`${fieldInput} cursor-pointer px-3.5`}
              >
                {kprDefaults.tenorOptions.map((years) => (
                  <option key={years} value={years}>
                    {t("kprTenorYears", { years })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="kpr-interest" className={fieldLabel}>
                {t("kprInterestRate")}
              </label>
              <div className="relative">
                <input
                  id="kpr-interest"
                  type="number"
                  inputMode="decimal"
                  value={interestPercent}
                  onChange={(e) => setInterestPercent(Number(e.target.value))}
                  min={ranges.annualInterestPercent.min}
                  max={ranges.annualInterestPercent.max}
                  step={ranges.annualInterestPercent.step}
                  className={`${fieldInput} pr-9 pl-3.5`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hasil */}
        <div className="flex flex-col rounded-2xl bg-navy-950 p-5 text-white md:p-6" aria-live="polite">
          <span className="text-xs font-semibold text-blue-200">{t("kprMonthlyEstimation")}</span>
          <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight md:text-[1.75rem]">
            {money(result.monthlyInstallment)}
            <span className="ml-1 text-sm font-medium text-slate-300">{tCommon("perMonth")}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">{t("kprTenorYears", { years: tenorYears })}</p>

          <dl className="mt-5 space-y-3 border-t border-white/10 pt-4 text-xs">
            {breakdown.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <dt className="text-slate-300">{row.label}</dt>
                <dd className="text-right font-semibold whitespace-nowrap text-white">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Catatan: disclaimer & bank rekanan */}
      <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <p className="flex items-start gap-1.5">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("kprDisclaimer")}
        </p>
        <p className="shrink-0">
          <span className="font-semibold text-slate-600">{t("kprPartnerBanks")}:</span>{" "}
          {partners.map((p) => p.name).join(" · ")}
        </p>
      </div>
    </section>
  );
}
