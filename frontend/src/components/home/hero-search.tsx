"use client";

import { Banknote, Building2, ChevronDown, MapPin, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { priceRanges } from "@/config/search";
import { useRouter } from "@/i18n/navigation";
import type { City, PropertyType } from "@/types/reference";

interface Props {
  cities: City[];
  propertyTypes: PropertyType[];
}

/** Kotak pencarian hero sesuai master_pro_landing_page (1).html. */
export function HeroSearch({ cities, propertyTypes }: Props) {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const range = priceRanges.find((r) => r.value === price);
    const query: Record<string, string> = {};
    if (city) query.city = city;
    if (type) query.type = type;
    if (range && "min" in range) query.min_price = String(range.min);
    if (range && "max" in range) query.max_price = String(range.max);
    router.push({ pathname: "/properties", query });
  }

  return (
    <div className="relative z-30 mt-10 md:mt-14">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-slate-900 shadow-2xl shadow-slate-950/40 sm:p-5 lg:p-6">
        <form
          id="propertySearchForm"
          onSubmit={submit}
          role="search"
          className="grid grid-cols-1 items-center gap-4 md:grid-cols-4"
        >
          {/* Field 1: Lokasi */}
          <div className="relative">
            <label
              htmlFor="searchLocation"
              className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
            >
              {t("searchLocation")}
            </label>
            <div className="relative flex items-center">
              <MapPin className="pointer-events-none absolute left-3 size-5 text-slate-400" />
              <select
                id="searchLocation"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-10 text-sm font-semibold text-slate-800 transition focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">{t("searchLocationAll")}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}, {c.province.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Field 2: Tipe Properti */}
          <div className="relative">
            <label
              htmlFor="propertyType"
              className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
            >
              {t("searchType")}
            </label>
            <div className="relative flex items-center">
              <Building2 className="pointer-events-none absolute left-3 size-5 text-slate-400" />
              <select
                id="propertyType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-8 pl-10 text-sm font-semibold text-slate-800 transition focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">{t("searchTypeAll")}</option>
                {propertyTypes.map((pt) => (
                  <option key={pt.id} value={pt.slug}>
                    {locale === "id" ? pt.name_id : pt.name_en}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-slate-400" />
            </div>
          </div>

          {/* Field 3: Rentang Harga */}
          <div className="relative">
            <label
              htmlFor="priceRange"
              className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
            >
              {t("searchPrice")}
            </label>
            <div className="relative flex items-center">
              <Banknote className="pointer-events-none absolute left-3 size-5 text-slate-400" />
              <select
                id="priceRange"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-8 pl-10 text-sm font-semibold text-slate-800 transition focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">{t("searchPriceAll")}</option>
                {priceRanges.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label[locale]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-slate-400" />
            </div>
          </div>

          {/* Field 4: Tombol Cari Properti */}
          <div className="pt-2 md:pt-5">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-card transition-all hover:bg-blue-700 hover:shadow-card-hover active:scale-95"
            >
              <Search className="size-4 stroke-[2.5]" />
              <span>{t("searchSubmit")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
