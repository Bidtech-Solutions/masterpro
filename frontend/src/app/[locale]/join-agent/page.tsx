import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CommissionTable } from "@/components/join-agent/commission-table";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { whatsappUrl } from "@/lib/whatsapp";

export async function generateMetadata({ params }: PageProps<"/[locale]/join-agent">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "joinAgent" });
  const seo = await getTranslations({ locale, namespace: "seo" });
  return buildMetadata({
    locale,
    href: "/join-agent",
    title: t("title"),
    description: seo("joinAgentDescription"),
  });
}

/**
 * Daftar Agen (PRD §5.5).
 * TODO(WEB-A-02/04/05/06): keuntungan, flowchart alur pendaftaran, kontak lengkap, FAQ — menunggu konten klien.
 */
export default async function JoinAgentPage({ params }: PageProps<"/[locale]/join-agent">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("joinAgent");

  return (
    <>
      <section className="bg-navy-950 py-20 text-white">
        <div className="container-page max-w-3xl">
          <h1 className="mb-4 font-display text-display-mobile font-extrabold tracking-tight md:text-display">
            {t("title")}
          </h1>
          <p className="mb-8 text-body-lg text-slate-200">{t("subtitle")}</p>
          <a
            href={whatsappUrl(site.contact.whatsappAdmin, t("whatsappMessage"))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-whatsapp px-6 py-3.5 font-display text-body-sm font-bold text-whatsapp-foreground transition-colors hover:bg-whatsapp-hover"
          >
            <MessageCircle className="size-5" aria-hidden />
            {t("ctaWhatsapp")}
          </a>
        </div>
      </section>
      <CommissionTable />
    </>
  );
}
