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

const linkClass = "transition-colors hover:text-sky-300";

/** Footer website (PRD WEB-G-02, DESIGN.md §0). */
export async function SiteFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-navy-800 bg-navy-950 text-white">
      <div className="container-page flex flex-col gap-12 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo variant="white" className="mb-4 h-12" />
            <p className="mb-6 max-w-sm text-body-sm leading-relaxed text-slate-300">{t("tagline")}</p>
            <address className="mb-6 space-y-2 text-body-sm text-slate-300 not-italic">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-[18px] shrink-0 text-sky-400" aria-hidden />
                <a
                  href={site.contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {site.contact.address}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="size-[18px] shrink-0 text-sky-400" aria-hidden />
                <a href={site.contact.phoneHref} className={linkClass}>
                  {site.contact.phone}
                </a>
                <span aria-hidden>/</span>
                <a href={`https://wa.me/${site.contact.whatsappAdmin}`} className={linkClass}>
                  {site.contact.whatsappDisplay}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="size-[18px] shrink-0 text-sky-400" aria-hidden />
                <a href={`mailto:${site.contact.email}`} className={linkClass}>
                  {site.contact.email}
                </a>
              </p>
            </address>
            <ul className="flex items-center gap-3">
              {site.social.map((s) => {
                const Icon = socialIcons[s.name] ?? Briefcase;
                return (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("social", { name: s.name })}
                      className="flex size-9 items-center justify-center rounded-full bg-navy-900 text-slate-300 transition-colors hover:bg-blue-600 hover:text-white"
                    >
                      <Icon className="size-[18px]" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <FooterColumn title={t("propertyTypes")} className="lg:col-span-3">
            {footerPropertyLinks.map((l) => (
              <li key={l.label}>
                <Link href={{ pathname: "/properties", query: l.query }} className={linkClass}>
                  {t(l.label)}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={t("popularCities")} className="lg:col-span-2">
            {site.popularCities.map((c) => (
              <li key={c.slug}>
                <Link href={{ pathname: "/properties", query: { city: c.slug } }} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={t("company")} className="lg:col-span-3">
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
              <a
                href={`https://wa.me/${site.contact.whatsappAdmin}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {t("contactOffice")}
              </a>
            </li>
          </FooterColumn>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-navy-800 pt-8 text-caption text-slate-400 md:flex-row">
          <p>{t("copyright", { year })}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h2 className="mb-5 font-display text-h3 font-bold text-white">{title}</h2>
      <ul className="space-y-3 text-body-sm text-slate-300">{children}</ul>
    </div>
  );
}
