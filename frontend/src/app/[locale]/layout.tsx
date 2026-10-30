import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import "@/styles/globals.css";

import { GoogleAnalytics } from "@/components/common/google-analytics";
import { JsonLd } from "@/components/common/json-ld";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { site } from "@/config/site";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { organizationJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "id", namespace: "seo" });
  return {
    metadataBase: new URL(site.url),
    title: { default: t("defaultTitle"), template: `%s | ${site.name}` },
    description: t("defaultDescription"),
    applicationName: site.name,
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { themeColor: "#0b6bea" };

/** Root layout website publik (PRD §9.1). */
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations("common");
  // Hanya namespace yang dipakai Client Component dikirim ke browser.
  const clientMessages = { common: messages.common, nav: messages.nav, home: messages.home };

  return (
    <html lang={locale} className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-popover"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider messages={clientMessages}>
          <SiteHeader />
          <main id="konten" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
        <JsonLd data={organizationJsonLd()} />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
