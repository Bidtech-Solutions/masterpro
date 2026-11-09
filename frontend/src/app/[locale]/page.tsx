import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/common/json-ld";
import { SectionHeading } from "@/components/common/section-heading";
import { HeroHeading } from "@/components/home/hero-heading";
import { HeroSearch } from "@/components/home/hero-search";
import { PartnerMarquee } from "@/components/home/partner-marquee";
import { PopularCta } from "@/components/home/popular-cta";
import { PropertyCarousel } from "@/components/home/property-carousel";

import { PropertyCard } from "@/components/property/property-card";
import type { Locale } from "@/i18n/routing";
import { getLatestProperties, getPropertyTypes } from "@/lib/api/endpoints";
import { buildMetadata, websiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

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

  const [sale, rent, propertyTypes] = await Promise.all([
    getLatestProperties("sale"),
    getLatestProperties("rent"),
    getPropertyTypes(),
  ]);

  return (
    <>
      <section className="relative flex min-h-[calc(100svh-5rem)] min-h-[calc(100vh-5rem)] flex-col justify-center overflow-hidden bg-navy-950 px-4 py-12 text-white sm:px-6 md:py-16 lg:px-8">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt={t("heroImageAlt")}
            fill
            priority
            sizes="100vw"
            className="animate-hero-zoom object-cover object-center"
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

      <JsonLd data={websiteJsonLd(locale)} />
    </>
  );
}
