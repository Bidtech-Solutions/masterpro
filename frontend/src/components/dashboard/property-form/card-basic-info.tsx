"use client";

import { Building, Building2, Home, Info, Mountain, Store } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ListingType, MarketType } from "@/types/property";

export type PropertyTypeSlug = "rumah" | "apartemen" | "ruko" | "kos" | "tanah";

interface CardBasicInfoProps {
  listingType: ListingType;
  setListingType: (type: ListingType) => void;
  marketType: MarketType;
  setMarketType: (market: MarketType) => void;
  propertyType: PropertyTypeSlug;
  setPropertyType: (type: PropertyTypeSlug) => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (desc: string) => void;
}

const propertyTypes = [
  { slug: "rumah", label: "Rumah", icon: Home },
  { slug: "apartemen", label: "Apartemen", icon: Building },
  { slug: "ruko", label: "Ruko", icon: Store },
  { slug: "kos", label: "Gedung Kos", icon: Building2 },
  { slug: "tanah", label: "Tanah", icon: Mountain },
] as const;

export function CardBasicInfo({
  listingType,
  setListingType,
  marketType,
  setMarketType,
  propertyType,
  setPropertyType,
  title,
  setTitle,
  description,
  setDescription,
}: CardBasicInfoProps) {
  const t = useTranslations("dashboard");

  // Character count calculation (PRD §7.4 requires >= 50 characters)
  const charCount = description.length;
  const minChars = 50;
  const maxChars = 2000;
  const isMinMet = charCount >= minChars;
  const remainingChars = minChars - charCount;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-[#EBF5FF] text-[#2563EB]">
          <Info className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("cardBasicInfoTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("cardBasicInfoSubtitle")}</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Row 1: Tipe Transaksi & Status Pasar */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Tipe Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              {t("transactionType")} <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#F1F5F9] p-1">
              <button
                type="button"
                onClick={() => setListingType("sale")}
                className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                  listingType === "sale"
                    ? "border border-[#BFDBFE] bg-white text-[#2563EB] shadow-xs"
                    : "bg-transparent font-medium text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("forSale")}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Tanah & Kos don't allow rent in PRD §7.1
                  if (propertyType === "tanah" || propertyType === "kos") {
                    setPropertyType("rumah");
                  }
                  setListingType("rent");
                }}
                className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                  listingType === "rent"
                    ? "border border-[#BFDBFE] bg-white text-[#2563EB] shadow-xs"
                    : "bg-transparent font-medium text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("forRent")}
              </button>
            </div>
          </div>

          {/* Status Pasar */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              {t("marketStatus")} <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#F1F5F9] p-1">
              <button
                type="button"
                onClick={() => setMarketType("primary")}
                className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                  marketType === "primary"
                    ? "border border-[#BFDBFE] bg-white text-[#2563EB] shadow-xs"
                    : "bg-transparent font-medium text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("marketPrimary")}
              </button>
              <button
                type="button"
                onClick={() => setMarketType("secondary")}
                className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
                  marketType === "secondary"
                    ? "border border-[#BFDBFE] bg-white text-[#2563EB] shadow-xs"
                    : "bg-transparent font-medium text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("marketSecondary")}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Pilih Tipe Properti */}
        <div>
          <label className="block text-xs font-bold text-slate-700">
            {t("selectPropertyType")} <span className="text-red-500">*</span>
          </label>
          <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {propertyTypes.map((pt) => {
              const Icon = pt.icon;
              const isSelected = propertyType === pt.slug;
              // Kos and Tanah can only be sold (PRD §7.1)
              const isDisabled = listingType === "rent" && (pt.slug === "kos" || pt.slug === "tanah");

              return (
                <button
                  key={pt.slug}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setPropertyType(pt.slug)}
                  className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center transition-all ${
                    isDisabled
                      ? "cursor-not-allowed border border-slate-100 bg-slate-50 opacity-40"
                      : isSelected
                        ? "border-2 border-[#2563EB] bg-[#F8FAFC] font-bold text-[#2563EB] shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <Icon className={`mb-2 size-6 ${isSelected ? "text-[#2563EB]" : "text-slate-500"}`} />
                  <span className="text-xs">{pt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Judul Listing Publik */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              {t("publicListingTitle")} <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] font-normal text-slate-400">
              {t("titleCharCount", { current: title.length, max: 160 })}
            </span>
          </div>
          <input
            type="text"
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Rumah Minimalis Modern 2 Lantai Siap Huni Klaster Dutamas"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-hidden sm:text-sm"
          />
          <p className="mt-1.5 text-[11px] leading-normal text-slate-400">{t("publicTitleHint")}</p>
        </div>

        {/* Row 4: Deskripsi Lengkap Properti */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              {t("fullDescription")} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {charCount > 0 && !isMinMet && (
                <span className="text-[11px] font-medium text-amber-600">
                  {t("descMinRemaining", { count: remainingChars })}
                </span>
              )}
              {isMinMet && (
                <span className="text-[11px] font-medium text-emerald-600">{t("descMinMet")}</span>
              )}
              <span
                className={`text-[11px] ${
                  charCount === 0
                    ? "text-slate-400"
                    : isMinMet
                      ? "font-medium text-emerald-600"
                      : "font-medium text-amber-600"
                }`}
              >
                {t("descCharCountMin", { current: charCount, max: maxChars, min: minChars })}
              </span>
            </div>
          </div>
          <textarea
            rows={5}
            required
            maxLength={maxChars}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dijual cepat rumah hunian idaman bergaya minimalis di Klaster Dutamas, Batam Centre. Berlokasi strategis di lingkungan prestisius dengan penjagaan keamanan ketat 24 jam serta one gate system..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-hidden sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}
