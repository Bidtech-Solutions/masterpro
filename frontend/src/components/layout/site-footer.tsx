import { Briefcase, Camera, Mail, MapPin, Phone, PlayCircle, ThumbsUp, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/common/logo";
import { footerPropertyLinks } from "@/config/navigation";
import { site } from "@/config/site";
import { Link } from "@/i18n/navigation";

const socialIcons: Record<string, LucideIcon> = {
  Instagram: Camera,
  Facebook: ThumbsUp,
  LinkedIn: Briefcase,
  YouTube: PlayCircle,
};

const linkClass = "text-slate-300 text-sm hover:text-white transition-colors";

/** Footer website modern dark mega footer (PRD WEB-G-02, DESIGN.md §0). */
export async function SiteFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#0F1E36] bg-[#07132B] pt-16 pb-12 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-[#0F1E36] pb-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Kolom 1: Profil Perusahaan & Kontak */}
          <div className="space-y-4 lg:col-span-4">
            <div className="flex items-center gap-2">
              <Logo variant="white" className="h-10" />
            </div>
            <p className="max-w-sm pr-4 text-sm leading-relaxed text-slate-300">{t("tagline")}</p>

            <address className="space-y-2.5 pt-2 text-sm text-slate-300 not-italic">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-blue-500" aria-hidden />
                <a
                  href={site.contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  {site.contact.address}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-blue-500" aria-hidden />
                <a href={site.contact.phoneHref} className="transition-colors hover:text-white">
                  {site.contact.phone}
                </a>
                <span className="text-slate-500">/</span>
                <a
                  href={`https://wa.me/${site.contact.whatsappAdmin}`}
                  className="transition-colors hover:text-white"
                >
                  {site.contact.whatsappDisplay}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-blue-500" aria-hidden />
                <a href={`mailto:${site.contact.email}`} className="transition-colors hover:text-white">
                  {site.contact.email}
                </a>
              </p>
            </address>

            {/* Social Media Circular Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              {site.social.map((s) => {
                const Icon = socialIcons[s.name] ?? Briefcase;
                return (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("social", { name: s.name })}
                    className="flex size-9 items-center justify-center rounded-full bg-[#0F1E36] text-blue-400 transition-colors hover:bg-blue-600 hover:text-white"
                  >
                    <Icon className="size-4" aria-hidden />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Kolom 2: Tipe Properti */}
          <div className="lg:col-span-3">
            <FooterColumn title={t("propertyTypes")}>
              {footerPropertyLinks.map((l) => (
                <li key={l.label}>
                  <Link href={{ pathname: "/properties", query: l.query }} className={linkClass}>
                    {t(l.label)}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          </div>

          {/* Kolom 3: Kota Populer */}
          <div className="lg:col-span-2">
            <FooterColumn title={t("popularCities")}>
              {site.popularCities.map((c) => (
                <li key={c.slug}>
                  <Link href={{ pathname: "/properties", query: { city: c.slug } }} className={linkClass}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          </div>

          {/* Kolom 4: Perusahaan */}
          <div className="lg:col-span-3">
            <FooterColumn title={t("company")}>
              <li>
                <Link href="/" className={linkClass}>
                  {nav("home")}
                </Link>
              </li>
              <li>
                <Link href="/properties" className={linkClass}>
                  {nav("properties")}
                </Link>
              </li>
              <li>
                <Link href="/join-agent" className={linkClass}>
                  {nav("joinAgent")}
                </Link>
              </li>
              <li>
                <Link href="/properties" className={linkClass}>
                  {t("aboutUs")}
                </Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/${site.contact.whatsappAdmin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {t("contactOffice")}
                </a>
              </li>
              <li>
                <Link href="/properties" className={linkClass}>
                  {t("kprPartner")}
                </Link>
              </li>
              <li>
                <Link href="/properties" className={linkClass}>
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/properties" className={linkClass}>
                  {t("termsConditions")}
                </Link>
              </li>
            </FooterColumn>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-slate-400 sm:flex-row sm:text-sm">
          <p>{t("copyright", { year })}</p>
          <div className="flex items-center gap-6">
            <Link href="/properties" className="transition-colors hover:text-white">
              {t("privacyPolicy")}
            </Link>
            <Link href="/properties" className="transition-colors hover:text-white">
              {t("termsConditions")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-base font-bold text-white">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}
