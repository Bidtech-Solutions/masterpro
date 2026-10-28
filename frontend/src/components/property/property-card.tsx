import {
  ArrowRight,
  Bath,
  BedDouble,
  Home,
  Images,
  LandPlot,
  MapPin,
  MessageCircle,
  Ruler,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { site } from "@/config/site";
import { formatArea, formatPriceFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import { propertyInquiryMessage, whatsappUrl } from "@/lib/whatsapp";
import type { PropertyCard as PropertyCardData } from "@/types/property";

interface Props {
  property: PropertyCardData;
  locale: Locale;
  /** compact = kartu Beranda (desain Stitch); full = katalog, + badge & spesifikasi (DESIGN.md §0, §6.3). */
  variant?: "compact" | "full";
  priority?: boolean;
  className?: string;
}

/** Kartu listing (PRD WEB-H-02/03, WEB-P-04). */
export function PropertyCard({ property: p, locale, variant = "compact", priority, className }: Props) {
  const t = useTranslations("common");
  const href = { pathname: "/properties/[slug]", params: { slug: p.slug } } as const;
  const detailUrl = new URL(getPathname({ href, locale }), site.url).toString();
  const period =
    p.rent_period === "monthly" ? t("perMonth") : p.rent_period === "yearly" ? t("perYear") : null;
  const place = [p.location.district, p.location.city.name].filter(Boolean).join(", ");
  const typeName = locale === "id" ? p.property_type.name_id : p.property_type.name_en;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover",
        className,
      )}
    >
      <Link
        href={href}
        className="relative block aspect-[4/3] overflow-hidden bg-slate-100"
        tabIndex={-1}
        aria-hidden
      >
        {p.cover_image ? (
          <Image
            src={p.cover_image.url}
            alt={t("photoAlt", { title: p.title, n: 1 })}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Home className="size-12" aria-hidden />
          </div>
        )}
        {variant === "full" ? (
          <>
            <div className="absolute top-3 left-3 flex gap-1.5">
              <span
                className={cn(
                  "rounded-sm px-2 py-1 text-caption font-semibold text-white",
                  p.listing_type === "sale" ? "bg-navy-800" : "bg-rent",
                )}
              >
                {t(p.listing_type)}
              </span>
              <span
                className={cn(
                  "rounded-sm px-2 py-1 text-caption font-semibold",
                  p.market_type === "primary"
                    ? "border border-amber-400 bg-amber-50 text-amber-800"
                    : "bg-slate-100 text-slate-700",
                )}
              >
                {t(p.market_type)}
              </span>
            </div>
            {p.image_count > 0 ? (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-sm bg-navy-950/70 px-2 py-1 text-caption font-semibold text-white">
                <Images className="size-3.5" aria-hidden />
                {p.image_count}
              </span>
            ) : null}
            <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-caption font-semibold text-navy-800 backdrop-blur">
              {typeName}
            </span>
          </>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="mb-4">
          <p className="mb-1.5 font-display text-price font-extrabold text-blue-600 tabular-nums">
            {formatPriceFull(p.price, locale)}
            {period ? (
              <span className="font-sans text-body-sm font-normal text-slate-500"> {period}</span>
            ) : null}
          </p>
          <h3 className="mb-2 line-clamp-2 font-display text-lg leading-tight font-bold text-navy-900 transition-colors group-hover:text-blue-600">
            <Link href={href}>{p.title}</Link>
          </h3>
          <p className="flex items-center gap-1 text-body-sm text-slate-500">
            <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{place}</span>
          </p>
          {variant === "full" ? <Specs p={p} locale={locale} /> : null}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3">
          <Link
            href={href}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-2.5 font-display text-body-sm font-semibold text-slate-700 transition-all hover:border-blue-600 hover:text-blue-600"
          >
            {t("detail")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <a
            href={whatsappUrl(p.agent.whatsapp_number, propertyInquiryMessage(p, detailUrl, locale))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-whatsapp px-2 py-2.5 font-display text-body-sm font-bold whitespace-nowrap text-whatsapp-foreground shadow-sm transition-all hover:bg-whatsapp-hover active:scale-95"
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("contactAgent")}
          </a>
        </div>
      </div>
    </article>
  );
}

function Specs({ p, locale }: { p: PropertyCardData; locale: Locale }) {
  const t = useTranslations("common.spec");
  const items = [
    p.bedrooms != null && { icon: BedDouble, label: t("bedrooms", { n: p.bedrooms }) },
    p.bathrooms != null && { icon: Bath, label: t("bathrooms", { n: p.bathrooms }) },
    p.land_area != null && {
      icon: LandPlot,
      label: t("landArea", { area: formatArea(p.land_area, locale) }),
    },
    p.building_area != null && {
      icon: Ruler,
      label: t("buildingArea", { area: formatArea(p.building_area, locale) }),
    },
  ].filter(Boolean) as { icon: typeof Bath; label: string }[];
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-slate-700">
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1">
          <Icon className="size-3.5 text-slate-400" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
