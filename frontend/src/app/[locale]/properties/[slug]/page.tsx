import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/common/json-ld";
import { KprCalculatorCard } from "@/components/property/kpr-calculator-card";
import { PhotoGallery } from "@/components/property/photo-gallery";
import { PopularBanner } from "@/components/property/popular-banner";
import { PropertyDescription } from "@/components/property/property-description";
import { PropertyDetailSidebar } from "@/components/property/property-detail-sidebar";
import { PropertyLocationMap } from "@/components/property/property-location-map";
import { PropertySpecs } from "@/components/property/property-specs";
import { SimilarProperties } from "@/components/property/similar-properties";
import type { Locale } from "@/i18n/routing";
import { getPublicProperty, getSimilarProperties } from "@/lib/api/endpoints";
import { formatPriceFull } from "@/lib/format";
import { buildMetadata, realEstateListingJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

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

/** Detail properti (PRD §5.4, WEB-D-01..13). */
export default async function PropertyDetailPage({ params }: PageProps<"/[locale]/properties/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const [p, similar] = await Promise.all([getPublicProperty(slug), getSimilarProperties(slug, 3)]);

  if (!p) notFound();

  return (
    <>
      <div className="container-page py-6 md:py-10">
        {/* Galeri Bento Foto Sesuai Gambar Referensi */}
        <PhotoGallery images={p.images} title={p.title} />

        {/* Dua Kolom Utama (Konten Kiri & Sticky Sidebar Kanan) */}
        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Kolom Kiri: Spesifikasi, Deskripsi, Peta, Simulasi KPR */}
          <div className="min-w-0 space-y-6 md:space-y-8 lg:col-span-8">
            <PropertySpecs property={p} locale={locale as Locale} />
            <PropertyDescription
              description={p.description}
              facilities={p.facilities}
              locale={locale as string}
            />
            <PropertyLocationMap
              latitude={p.latitude}
              longitude={p.longitude}
              district={p.location.district}
              cityName={p.location.city.name}
              provinceName={p.location.province.name}
            />
            <KprCalculatorCard initialPrice={p.price} />
          </div>

          {/* Kolom Kanan: Sticky Sidebar (Harga, Profil Agen & Tombol WhatsApp) */}
          <div className="lg:col-span-4">
            <PropertyDetailSidebar property={p} locale={locale as Locale} />
          </div>
        </div>

        {/* Properti Serupa */}
        <SimilarProperties properties={similar} cityName={p.location.city.name} locale={locale as Locale} />

        {/* Banner Eksplorasi Properti Populer */}
        <PopularBanner />
      </div>

      {/* JSON-LD Schema RealEstateListing */}
      <JsonLd data={realEstateListingJsonLd(p, locale as Locale)} />
    </>
  );
}
