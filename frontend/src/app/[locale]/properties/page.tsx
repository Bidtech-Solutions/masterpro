import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Pagination } from "@/components/common/pagination";
import { HeroHeading } from "@/components/home/hero-heading";
import { HeroSearch } from "@/components/home/hero-search";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyFilterSidebar } from "@/components/property/property-filter-sidebar";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPropertyTypes, listPublicProperties, webQueryToApi } from "@/lib/api/endpoints";
import { buildMetadata } from "@/lib/seo";

// Halaman membaca searchParams → dirender dinamis; data API di-cache 60 dtk (PRD §9.2).

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/properties">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "seo" });
  const tp = await getTranslations({ locale, namespace: "properties" });
  // Filter selain listing/type/page → noindex (PRD §9.3). `city` diabaikan karena katalog khusus Batam.
  const indexable = Object.keys(sp).every((k) => ["listing", "type", "page"].includes(k));
  // Canonical memuat filter yang boleh diindeks agar halaman terfilter tidak ber-canonical ke katalog polos.
  const query: Record<string, string> = {};
  if (indexable) {
    for (const k of ["listing", "type"]) {
      const v = [sp[k]].flat()[0];
      if (v) query[k] = v;
    }
    const page = Number([sp.page].flat()[0]);
    if (Number.isInteger(page) && page > 1) query.page = String(page);
  }
  return buildMetadata({
    locale,
    href: Object.keys(query).length > 0 ? { pathname: "/properties", query } : "/properties",
    title: tp("title"),
    description: t("propertiesDescription"),
    noindex: !indexable,
  });
}

/**
 * Katalog properti (PRD §5.3).
 */
export default async function PropertiesPage({ params, searchParams }: PageProps<"/[locale]/properties">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("properties");
  const th = await getTranslations("home");
  const sp = await searchParams;
  const query = webQueryToApi(sp);

  const [result, propertyTypes] = await Promise.all([listPublicProperties(query), getPropertyTypes()]);

  const items = result?.data ?? [];
  const meta = result?.meta;

  return (
    <>
      {/* Hero Section Banner dengan Form Pencarian Horizontal */}
      <section className="relative overflow-hidden bg-navy-950 px-4 py-12 text-white sm:px-6 md:py-16 lg:px-8">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt={th("heroImageAlt")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1128]/72 via-[#0A1128]/80 to-[#0A1128]/88" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <HeroHeading />
          <div className="animate-fade-up [animation-delay:900ms]">
            <HeroSearch propertyTypes={propertyTypes} />
          </div>
        </div>
      </section>

      {/* Main Content: Layout Dua Kolom (Sidebar Filter & Grid Properti) */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {/* Kolom Kiri: Sidebar Filter */}
          <PropertyFilterSidebar propertyTypes={propertyTypes} searchParams={sp} />

          {/* Kolom Kanan: Grid Properti & Pagination */}
          <div className="min-w-0 flex-1">
            {items.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {items.map((p, i) => (
                  <PropertyCard key={p.id} property={p} locale={locale} priority={i < 2} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-20 text-center">
                <p className="mb-2 font-display text-2xl font-bold text-navy-900">{t("empty")}</p>
                <p className="mb-6 text-sm text-slate-500">{t("emptyHint")}</p>
                <Link
                  href="/properties"
                  className="inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                >
                  {t("resetFilters")}
                </Link>
              </div>
            )}

            {meta && meta.total_pages > 1 ? (
              <Pagination
                page={meta.page}
                totalPages={meta.total_pages}
                searchParams={sp}
                label={t("pagination")}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
