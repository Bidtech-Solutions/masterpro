"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PropertyType } from "@/types/reference";

interface Props {
  propertyTypes: PropertyType[];
  searchParams: Record<string, string | string[] | undefined>;
}

export function PropertyFilterSidebar({ propertyTypes, searchParams }: Props) {
  const t = useTranslations("properties");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Helper membaca string dari searchParams
  const getParam = (key: string): string => {
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0] ?? "";
    return val ?? "";
  };

  // State lokal filter
  const [listing, setListing] = useState<string>(getParam("listing"));
  const [marketTypes, setMarketTypes] = useState<string[]>(() => {
    const m = getParam("market");
    return m ? m.split(",") : [];
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const tp = getParam("type");
    return tp ? tp.split(",") : [];
  });
  const [minPrice, setMinPrice] = useState<string>(getParam("min_price"));
  const [maxPrice, setMaxPrice] = useState<string>(getParam("max_price"));

  // Sinkronisasi jika searchParams URL berubah (misal dari Hero Search)
  const [prevParams, setPrevParams] = useState(searchParams);
  if (prevParams !== searchParams) {
    setPrevParams(searchParams);
    setListing(getParam("listing"));
    const m = getParam("market");
    setMarketTypes(m ? m.split(",") : []);
    const tp = getParam("type");
    setSelectedTypes(tp ? tp.split(",") : []);
    setMinPrice(getParam("min_price"));
    setMaxPrice(getParam("max_price"));
  }

  // Handler toggle listing (Beli / Sewa)
  function handleListingToggle(val: "sale" | "rent") {
    setListing((prev) => (prev === val ? "" : val));
  }

  // Handler toggle market segment (Primary / Secondary)
  function handleMarketToggle(val: "primary" | "secondary") {
    setMarketTypes((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val],
    );
  }

  // Handler toggle tipe properti
  function handleTypeToggle(slug: string) {
    setSelectedTypes((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug],
    );
  }

  // Format angka ke format rupiah ribuan (misal 1000000 -> 1.000.000)
  function formatNumber(val: string) {
    const numeric = val.replace(/\D/g, "");
    if (!numeric) return "";
    return new Intl.NumberFormat("id-ID").format(Number(numeric));
  }

  function handlePriceChange(val: string, setter: (v: string) => void) {
    const numeric = val.replace(/\D/g, "");
    setter(numeric);
  }

  // Terapkan filter ke URL
  function applyFilters() {
    const query: Record<string, string> = {};

    // Pertahankan kota atau query pencarian dari hero bar jika ada
    const city = getParam("city");
    if (city) query.city = city;
    const q = getParam("q");
    if (q) query.q = q;

    if (listing) query.listing = listing;
    if (marketTypes.length > 0) query.market = marketTypes.join(",");
    if (selectedTypes.length > 0) query.type = selectedTypes.join(",");

    let finalMin = minPrice;
    let finalMax = maxPrice;
    if (finalMin && finalMax && Number(finalMin) > Number(finalMax)) {
      finalMin = maxPrice;
      finalMax = minPrice;
      setMinPrice(finalMin);
      setMaxPrice(finalMax);
    }

    if (finalMin) query.min_price = finalMin;
    if (finalMax) query.max_price = finalMax;

    startTransition(() => {
      router.push({ pathname: "/properties", query });
      setMobileOpen(false);
    });
  }

  // Reset semua filter
  function handleReset() {
    setListing("");
    setMarketTypes([]);
    setSelectedTypes([]);
    setMinPrice("");
    setMaxPrice("");

    startTransition(() => {
      router.push("/properties");
      setMobileOpen(false);
    });
  }

  // Format nama tipe properti sesuai gambar referensi
  function getTypeName(pt: PropertyType) {
    if (pt.slug === "rumah") return locale === "id" ? "Rumah Tinggal" : "Houses";
    if (pt.slug === "apartemen")
      return locale === "id" ? "Apartemen & Kondominium" : "Apartments & Condos";
    if (pt.slug === "ruko") return locale === "id" ? "Ruko / Shophouse" : "Shophouses";
    if (pt.slug === "kos") return locale === "id" ? "Kost / Guesthouse" : "Boarding Houses";
    if (pt.slug === "tanah") return locale === "id" ? "Tanah & Lahan Kavling" : "Land & Plots";
    return locale === "id" ? pt.name_id : pt.name_en;
  }

  const filterContent = (
    <div className="space-y-4">
      {/* Header: Ikon + Judul + Reset */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4.5 text-blue-600" aria-hidden />
          <h2 className="font-display text-base font-bold text-slate-900">{t("filtersTitle")}</h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          {t("reset")}
        </button>
      </div>

      {/* 1. Tipe Listing */}
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
          {t("listingType")}
        </h3>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleListingToggle("sale")}
            className={cn(
              "rounded-lg py-2 text-center text-xs font-bold transition-all sm:text-sm",
              listing === "sale"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {t("buySale")}
          </button>
          <button
            type="button"
            onClick={() => handleListingToggle("rent")}
            className={cn(
              "rounded-lg py-2 text-center text-xs font-bold transition-all sm:text-sm",
              listing === "rent"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {t("rent")}
          </button>
        </div>
      </div>

      {/* 2. Segmen Pasar */}
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
          {t("marketSegment")}
        </h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700 select-none sm:text-sm">
            <input
              type="checkbox"
              checked={marketTypes.includes("primary")}
              onChange={() => handleMarketToggle("primary")}
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t("primaryNew")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700 select-none sm:text-sm">
            <input
              type="checkbox"
              checked={marketTypes.includes("secondary")}
              onChange={() => handleMarketToggle("secondary")}
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t("secondaryReady")}</span>
          </label>
        </div>
      </div>

      {/* 3. Tipe Properti */}
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
          {t("propertyType")}
        </h3>
        <div className="space-y-2">
          {propertyTypes.map((pt) => {
            const isChecked = selectedTypes.includes(pt.slug);
            return (
              <label
                key={pt.id}
                className="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-700 select-none sm:text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleTypeToggle(pt.slug)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{getTypeName(pt)}</span>
                </div>
                {pt.active_listing_count > 0 ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {pt.active_listing_count}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Rentang Harga (Rp) */}
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
          {t("priceRange")}
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="filter-min-price"
              className="mb-1 block text-[11px] font-semibold text-slate-500"
            >
              {t("minPrice")}
            </label>
            <input
              id="filter-min-price"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatNumber(minPrice)}
              onChange={(e) => handlePriceChange(e.target.value, setMinPrice)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center text-xs font-semibold text-slate-800 transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="filter-max-price"
              className="mb-1 block text-[11px] font-semibold text-slate-500"
            >
              {t("maxPrice")}
            </label>
            <input
              id="filter-max-price"
              type="text"
              inputMode="numeric"
              placeholder="Tak terbatas"
              value={formatNumber(maxPrice)}
              onChange={(e) => handlePriceChange(e.target.value, setMaxPrice)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center text-xs font-semibold text-slate-800 transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tombol Terapkan Filter */}
      <div className="pt-1">
        <button
          type="button"
          onClick={applyFilters}
          disabled={isPending}
          className="w-full rounded-xl bg-blue-600 py-3 text-center text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-70 sm:text-sm"
        >
          {isPending ? "Memuat..." : t("applyFilter")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Tombol Mobile Toggle Filter */}
      <div className="mb-6 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-600 hover:text-blue-600"
        >
          <SlidersHorizontal className="size-4 text-blue-600" />
          <span>{t("filtersTitle")}</span>
        </button>
      </div>

      {/* Desktop Sidebar Card yang mengikuti saat scroll - Rapi & Tanpa Scrollbar */}
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:w-80 lg:shrink-0 lg:self-start">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
          {filterContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex bg-navy-950/60 backdrop-blur-sm lg:hidden">
          <div className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X className="size-5" />
            </button>
            <div className="mt-4 flex-1 overflow-y-auto pr-1">{filterContent}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
