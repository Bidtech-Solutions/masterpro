"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { useTranslations } from "next-intl";

import { calculateKpr } from "@/lib/kpr";

interface Props {
  initialPrice: number;
}

export function KprCalculatorCard({ initialPrice }: Props) {
  const t = useTranslations("propertyDetail");

  const [price, setPrice] = useState<number>(initialPrice > 0 ? initialPrice : 1_250_000_000);
  const [dpPercent, setDpPercent] = useState<number>(20);
  const [tenorYears, setTenorYears] = useState<number>(20);
  const [interestPercent, setInterestPercent] = useState<number>(6.0);

  const kprResult = useMemo(() => {
    return calculateKpr({
      price: Math.max(1_000_000, price),
      downPaymentPercent: dpPercent,
      tenorYears,
      annualInterestPercent: interestPercent,
    });
  }, [price, dpPercent, tenorYears, interestPercent]);

  const tenorOptions = [5, 10, 15, 20, 25, 30];

  const formatRupiah = (val: number) => {
    return "Rp " + Math.round(val).toLocaleString("id-ID");
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Calculator className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-navy-900">{t("kprTitle")}</h2>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">{t("kprSubtitle")}</p>
        </div>
      </div>

      {/* Grid: Form Input (Kiri) & Card Hasil (Kanan) */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Kontrol Input (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Harga Properti */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-600 uppercase">
              {t("kprPropertyPrice")}
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={10_000_000}
                step={10_000_000}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-4 pl-10 text-sm font-bold text-navy-900 transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Uang Muka / DP */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                {t("kprDownPayment")}
              </label>
              <span className="text-xs font-semibold text-blue-700">
                {dpPercent}% ({formatRupiah(kprResult.downPayment)})
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={dpPercent}
              onChange={(e) => setDpPercent(Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
          </div>

          {/* Jangka Waktu (Tenor) */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-600 uppercase">
              {t("kprTenor")}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {tenorOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTenorYears(opt)}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                    tenorYears === opt
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {opt} th
                </button>
              ))}
            </div>
          </div>

          {/* Suku Bunga Pertahun */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-600 uppercase">
              {t("kprInterestRate")}
            </label>
            <div className="relative">
              <input
                type="number"
                value={interestPercent}
                onChange={(e) => setInterestPercent(Number(e.target.value))}
                min={1}
                max={20}
                step={0.1}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-navy-900 transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-semibold text-slate-400">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Card Hasil Kalkulasi (5 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-blue-50/30 p-5 md:p-6 lg:col-span-5">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-blue-700 uppercase">
              {t("kprMonthlyEstimation")}
            </span>
            <div className="mt-1 font-display text-2xl font-extrabold tracking-tight text-blue-600 md:text-3xl">
              {formatRupiah(kprResult.monthlyInstallment)}
              <span className="text-xs font-normal text-slate-500"> /bulan</span>
            </div>

            <div className="mt-5 space-y-2.5 border-t border-blue-200/60 pt-4 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("kprLoanPrincipal")}</span>
                <span className="font-semibold text-slate-800">{formatRupiah(kprResult.loanAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("kprTotalPayment")}</span>
                <span className="font-semibold text-slate-800">{formatRupiah(kprResult.totalPayment)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("kprMinimumIncome")}</span>
                <span className="font-semibold text-slate-800">{formatRupiah(kprResult.minimumIncome)}</span>
              </div>
            </div>
          </div>

          {/* Logo / Badge Rekanan Bank */}
          <div className="mt-6 border-t border-blue-200/60 pt-3">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {t("kprPartnerBanks")}
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {["Mandiri", "BCA", "BRI", "CIMB", "BTN"].map((bank) => (
                <span
                  key={bank}
                  className="rounded-md border border-slate-200/60 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-2xs"
                >
                  {bank}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
