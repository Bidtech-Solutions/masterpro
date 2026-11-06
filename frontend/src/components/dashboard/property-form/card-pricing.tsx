"use client";

import { Tag } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ListingType, RentPeriod } from "@/types/property";

interface CardPricingProps {
  price: number;
  setPrice: (price: number) => void;
  listingType: ListingType;
  rentPeriod: RentPeriod | null;
  setRentPeriod: (period: RentPeriod | null) => void;
  isNegotiable: boolean;
  setIsNegotiable: (nego: boolean) => void;
}

function toTerbilang(num: number): string {
  if (num <= 0) return "Nol Rupiah";
  const units = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function terbilangHelper(n: number): string {
    if (n < 12) return units[n] ?? "";
    if (n < 20) return `${terbilangHelper(n - 10)} Belas`;
    if (n < 100) return `${terbilangHelper(Math.floor(n / 10))} Puluh ${terbilangHelper(n % 10)}`.trim();
    if (n < 200) return `Seratus ${terbilangHelper(n - 100)}`.trim();
    if (n < 1000) return `${terbilangHelper(Math.floor(n / 100))} Ratus ${terbilangHelper(n % 100)}`.trim();
    if (n < 2000) return `Seribu ${terbilangHelper(n - 1000)}`.trim();
    if (n < 1000000)
      return `${terbilangHelper(Math.floor(n / 1000))} Ribu ${terbilangHelper(n % 1000)}`.trim();
    if (n < 1000000000)
      return `${terbilangHelper(Math.floor(n / 1000000))} Juta ${terbilangHelper(n % 1000000)}`.trim();
    if (n < 1000000000000)
      return `${terbilangHelper(Math.floor(n / 1000000000))} Miliar ${terbilangHelper(n % 1000000000)}`.trim();
    return `${terbilangHelper(Math.floor(n / 1000000000000))} Triliun ${terbilangHelper(n % 1000000000000)}`.trim();
  }

  return `${terbilangHelper(num)} Rupiah`;
}

export function CardPricing({
  price,
  setPrice,
  listingType,
  rentPeriod,
  setRentPeriod,
  isNegotiable,
  setIsNegotiable,
}: CardPricingProps) {
  const t = useTranslations("dashboard");

  const formattedValue = price > 0 ? price.toLocaleString("id-ID") : "";
  const spelledText = price > 0 ? toTerbilang(price) : "Nol Rupiah";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setPrice(raw ? parseInt(raw, 10) : 0);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-[#EBF5FF] text-[#2563EB]">
          <Tag className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("cardPricingTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("cardPricingSubtitle")}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Harga Properti (IDR) */}
        <div>
          <label className="block text-xs font-bold text-slate-700">{t("propertyPrice")} *</label>
          <div className="relative mt-1.5">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-slate-500">
              Rp
            </span>
            <input
              type="text"
              required
              value={formattedValue}
              onChange={handleInputChange}
              placeholder="1.250.000.000"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3.5 pl-10 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:border-sky-500 focus:outline-hidden sm:text-sm"
            />
          </div>

          {price > 0 && (
            <p className="mt-1.5 text-[11px] font-medium text-sky-700">
              {t("priceSpelledOut", {
                amount: price.toLocaleString("id-ID"),
                spelled: spelledText,
              })}
            </p>
          )}
        </div>

        {/* Kondisional: Periode Sewa jika Disewa */}
        {listingType === "rent" && (
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700">Periode Sewa *</label>
            <div className="mt-1.5 grid max-w-xs grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRentPeriod("yearly")}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  rentPeriod === "yearly"
                    ? "border border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-500"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tahunan
              </button>
              <button
                type="button"
                onClick={() => setRentPeriod("monthly")}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  rentPeriod === "monthly"
                    ? "border border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-500"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Bulanan
              </button>
            </div>
          </div>
        )}

        {/* Checkbox Nego */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isNegotiable"
            checked={isNegotiable}
            onChange={(e) => setIsNegotiable(e.target.checked)}
            className="size-4 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <label htmlFor="isNegotiable" className="cursor-pointer text-xs font-semibold text-slate-700">
            Harga Bisa Nego
          </label>
        </div>
      </div>
    </div>
  );
}
