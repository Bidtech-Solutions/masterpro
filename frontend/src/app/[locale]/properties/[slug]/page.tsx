import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import type { Locale } from "@/i18n/routing";
import { getPublicProperty } from "@/lib/api/endpoints";
import { formatPriceFull } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

// ISR on-demand: tidak ada prerender saat build, halaman dibuat saat pertama diakses (PRD §9.2).
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/properties/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getPublicProperty(slug);
  if (!p) return {};
  return buildMetadata({
    locale: locale as Locale,
    href: { pathname: "/properties/[slug]", params: { slug } },
    title: p.title,
    description: `${p.title} — ${formatPriceFull(p.price, locale as Locale)}, ${p.location.city.name}`,
    image: p.cover_image?.url,
  });
}

/**
 * Detail properti (PRD §5.4).
 * TODO(WEB-D-01..13): galeri, spesifikasi, deskripsi, kartu agen + WhatsApp, KPR (lib/kpr.ts),
 * properti serupa, JSON-LD RealEstateListing. Menunggu endpoint GET /public/properties/{slug} (API.md §7.2).
 */
export default async function PropertyDetailPage({ params }: PageProps<"/[locale]/properties/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const p = await getPublicProperty(slug);
  if (!p) notFound();
  const t = await getTranslations("propertyDetail");

  return (
    <div className="container-page py-12">
      <h1 className="mb-2 font-display text-h1 font-bold text-navy-900">{p.title}</h1>
      <p className="mb-4 text-body-sm text-slate-500">{t("code", { code: p.code })}</p>
      <p className="font-display text-price-lg font-extrabold text-blue-600">
        {formatPriceFull(p.price, locale as Locale)}
      </p>
    </div>
  );
}
