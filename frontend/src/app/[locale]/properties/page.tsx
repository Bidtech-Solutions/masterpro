import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SectionHeading } from "@/components/common/section-heading";
import { Pagination } from "@/components/common/pagination";
import { PropertyCard } from "@/components/property/property-card";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { listPublicProperties, webQueryToApi } from "@/lib/api/endpoints";
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
  // Filter selain listing/type/city/page → noindex (PRD §9.3).
  const indexable = Object.keys(sp).every((k) => ["listing", "type", "city", "page"].includes(k));
  return buildMetadata({
    locale,
    href: "/properties",
    title: tp("title"),
    description: t("propertiesDescription"),
    noindex: !indexable,
  });
}

/**
 * Katalog properti (PRD §5.3).
 * TODO(WEB-P-01/02/03/05/07): bar pencarian, filter sidebar/bottom sheet, urutan, chip filter aktif, skeleton.
 */
export default async function PropertiesPage({ params, searchParams }: PageProps<"/[locale]/properties">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("properties");
  const sp = await searchParams;
  const query = webQueryToApi(sp);
  const result = await listPublicProperties(query);
  const items = result?.data ?? [];
  const meta = result?.meta;

  const title =
    query.listing_type === "sale"
      ? t("titleSale")
      : query.listing_type === "rent"
        ? t("titleRent")
        : t("title");

  return (
    <div className="container-page py-12 md:py-16">
      <SectionHeading as="h1" title={title} className="mb-2" />
      <p className="mb-8 text-body-sm text-slate-500">{t("found", { count: meta?.total ?? 0 })}</p>

      {items.length > 0 ? (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <li key={p.id}>
              <PropertyCard property={p} locale={locale} variant="full" priority={i < 2} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <p className="mb-2 font-display text-h3 font-bold text-navy-900">{t("empty")}</p>
          <p className="mb-6 text-body-sm text-slate-500">{t("emptyHint")}</p>
          <Link
            href="/properties"
            className="font-display text-body-sm font-bold text-blue-600 hover:text-blue-700"
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
  );
}
