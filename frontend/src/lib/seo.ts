import type { Metadata } from "next";

import { site } from "@/config/site";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Href = Parameters<typeof getPathname>[0]["href"];

/** URL absolut untuk path terlokalisasi. */
export function absoluteUrl(href: Href, locale: Locale): string {
  return new URL(getPathname({ href, locale }), site.url).toString();
}

/** Peta hreflang (id-ID, en-US, x-default → /id) untuk metadata & sitemap (PRD §9.3). */
export function alternateLanguages(href: Href): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l === "id" ? "id-ID" : "en-US"] = absoluteUrl(href, l);
  languages["x-default"] = absoluteUrl(href, routing.defaultLocale);
  return languages;
}

/**
 * Metadata standar halaman publik: canonical, hreflang, Open Graph, Twitter (PRD §9.3).
 * `title` string memakai template layout; `{ absolute }` dipakai apa adanya (Beranda).
 * Kunci `title` sengaja tidak disertakan bila kosong agar tidak menimpa default layout.
 */
export function buildMetadata(opts: {
  locale: Locale;
  href: Href;
  title?: string | { absolute: string };
  description: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(opts.href, opts.locale);
  const image = opts.image ?? new URL(site.ogImage, site.url).toString();
  const shareTitle = typeof opts.title === "object" ? opts.title.absolute : (opts.title ?? site.name);
  return {
    ...(opts.title ? { title: opts.title } : {}),
    description: opts.description,
    alternates: { canonical: url, languages: alternateLanguages(opts.href) },
    openGraph: {
      type: "website",
      url,
      siteName: site.name,
      title: shareTitle,
      description: opts.description,
      locale: opts.locale === "id" ? "id_ID" : "en_US",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: opts.description,
      images: [image],
    },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
  };
}

/** JSON-LD FAQPage untuk blok FAQ Beranda. */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

/** JSON-LD Organization + RealEstateAgent (PRD §9.4). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    name: site.name,
    url: site.url,
    logo: new URL(site.logo, site.url).toString(),
    image: new URL(site.ogImage, site.url).toString(),
    email: site.contact.email,
    telephone: site.contact.phone,
    address: { "@type": "PostalAddress", streetAddress: site.contact.address, addressCountry: "ID" },
    sameAs: site.social.map((s) => s.href),
  };
}

/** JSON-LD WebSite + SearchAction untuk Beranda. */
export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/properties", locale)}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
