import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/common/json-ld";
import { SectionHeading } from "@/components/common/section-heading";
import { HeroSearch } from "@/components/home/hero-search";
import { PartnerMarquee } from "@/components/home/partner-marquee";
import { PopularCta } from "@/components/home/popular-cta";
import { PropertyCarousel } from "@/components/home/property-carousel";
import { SeoContent } from "@/components/home/seo-content";
import { PropertyCard } from "@/components/property/property-card";
import type { Locale } from "@/i18n/routing";
import { getCitiesWithListings, getLatestProperties, getPropertyTypes } from "@/lib/api/endpoints";
import { buildMetadata, websiteJsonLd } from "@/lib/seo";

export const revalidate = 300; // PRD §9.2

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildMetadata({
    locale,
    href: "/",
    title: { absolute: t("defaultTitle") },
    description: t("defaultDescription"),
  });
}

/** Beranda (PRD §5.2, desain docs/stitch/home.png). */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [sale, rent, propertyTypes, cities] = await Promise.all([
    getLatestProperties("sale"),
    getLatestProperties("rent"),
    getPropertyTypes(),
    getCitiesWithListings(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 py-20 text-white md:py-28">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt={t("heroImageAlt")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/75 to-blue-700/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-transparent to-navy-950/50" />
        </div>
        <div className="relative z-10 container-page">
          <div className="mb-12 max-w-3xl">
            <h1 className="mb-6 font-display text-display-mobile leading-tight font-extrabold tracking-tight md:text-display">
              {t("heroTitle")} <br className="hidden sm:inline" />
              <span className="text-3xl font-normal text-slate-300 md:text-5xl">{t("heroTitlePrefix")} </span>
              <span className="font-accent font-semibold tracking-normal text-sky-300 italic drop-shadow-sm">
                {t("heroTitleAccent")}
              </span>
            </h1>
            <p className="max-w-2xl text-body leading-relaxed text-slate-200/95 md:text-body-lg">
              {t("heroSubtitle")}
            </p>
          </div>
          <HeroSearch cities={cities} propertyTypes={propertyTypes} />
        </div>
      </section>

      {sale.length > 0 ? (
        <PropertyCarousel
          heading={<SectionHeading title={t("latestSale")} accent={t("latestAccent")} />}
          seeAllHref={{ pathname: "/properties", query: { listing: "sale" } }}
        >
          {sale.map((p) => (
            <PropertyCard key={p.id} property={p} locale={locale} />
          ))}
        </PropertyCarousel>
      ) : null}

      {rent.length > 0 ? (
        <PropertyCarousel
          variant="tinted"
          heading={<SectionHeading title={t("latestRent")} accent={t("latestAccent")} />}
          seeAllHref={{ pathname: "/properties", query: { listing: "rent" } }}
        >
          {rent.map((p) => (
            <PropertyCard key={p.id} property={p} locale={locale} />
          ))}
        </PropertyCarousel>
      ) : null}

      <PartnerMarquee />
      <PopularCta />
      <SeoContent />
      <JsonLd data={websiteJsonLd(locale)} />
    </>
  );
}
