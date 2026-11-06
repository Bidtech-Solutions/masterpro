import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AgentBenefits } from "@/components/join-agent/agent-benefits";
import { AgentCommission } from "@/components/join-agent/agent-commission";
import { AgentFaq } from "@/components/join-agent/agent-faq";
import { AgentHero } from "@/components/join-agent/agent-hero";
import { PopularBanner } from "@/components/property/popular-banner";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/join-agent">): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale: locale as Locale, namespace: "seo" });
  const tJoin = await getTranslations({ locale: locale as Locale, namespace: "joinAgent" });

  return buildMetadata({
    locale: locale as Locale,
    href: "/join-agent",
    title: tJoin("title"),
    description: tSeo("joinAgentDescription"),
  });
}

/** Halaman Daftar Agen (PRD WEB-A-01..05, §5.0). */
export default async function JoinAgentPage({ params }: PageProps<"/[locale]/join-agent">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 1. Hero Section & Metrics */}
      <AgentHero />

      {/* 2. Keuntungan Menjadi Mitra Agen */}
      <AgentBenefits />

      {/* 3. Struktur Komisi Transparan (Section #komisi) */}
      <AgentCommission />

      {/* 4. Frequently Asked Questions (Interactive Accordion) */}
      <AgentFaq />

      {/* 5. Banner Eksplorasi Properti Populer */}
      <div className="container-page pb-16 md:pb-24">
        <PopularBanner />
      </div>
    </div>
  );
}
