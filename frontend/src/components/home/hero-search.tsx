"use client";

import { Banknote, Building2, ChevronDown, MapPin, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent, type ReactNode } from "react";

import { priceRanges } from "@/config/search";
import { useRouter } from "@/i18n/navigation";
import type { City, PropertyType } from "@/types/reference";

interface Props {
  cities: City[];
  propertyTypes: PropertyType[];
}

/** Kotak pencarian hero: Lokasi · Tipe · Rentang Harga (PRD WEB-H-01, DESIGN.md §0). */
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
    <form
      onSubmit={submit}
      role="search"
      className="mx-auto max-w-6xl rounded-xl border border-slate-200/90 bg-white p-5 text-slate-900 shadow-popover md:p-6"
    >
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <Field
          id="hero-city"
          label={t("searchLocation")}
          icon={<MapPin className="size-5" />}
          className="lg:col-span-4"
        >
          <select
            id="hero-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={selectClass}
          >
            <option value="">{t("searchLocationAll")}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}, {c.province.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="hero-type"
          label={t("searchType")}
          icon={<Building2 className="size-5" />}
          className="lg:col-span-3"
        >
          <select
            id="hero-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={selectClass}
          >
            <option value="">{t("searchTypeAll")}</option>
            {propertyTypes.map((pt) => (
              <option key={pt.id} value={pt.slug}>
                {locale === "id" ? pt.name_id : pt.name_en}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="hero-price"
          label={t("searchPrice")}
          icon={<Banknote className="size-5" />}
          className="lg:col-span-3"
        >
          <select
            id="hero-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={selectClass}
          >
            <option value="">{t("searchPriceAll")}</option>
            {priceRanges.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label[locale]}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2 lg:col-span-2">
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 font-display text-body-sm font-bold text-white shadow-card transition-all hover:bg-blue-700 hover:shadow-card-hover active:scale-95"
          >
            <Search className="size-[18px]" aria-hidden />
            {t("searchSubmit")}
          </button>
        </div>
      </div>
    </form>
  );
}

const selectClass =
  "h-12 w-full cursor-pointer appearance-none bg-transparent pr-8 pl-11 text-body-sm text-navy-900 focus:outline-none";

function Field({
  id,
  label,
  icon,
  className,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block font-display text-caption font-bold tracking-wider text-slate-500 uppercase"
      >
        {label}
      </label>
      <div className="relative flex items-center rounded-md border border-slate-200 bg-slate-50 transition-all focus-within:border-blue-600 focus-within:bg-white">
        <span className="pointer-events-none absolute left-3.5 text-slate-400" aria-hidden>
          {icon}
        </span>
        {children}
        <ChevronDown className="pointer-events-none absolute right-3 size-4 text-slate-400" aria-hidden />
      </div>
    </div>
  );
}
