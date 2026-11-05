import { ArrowRight, Bath, BedDouble, Home, Images, LandPlot, MapPin, Ruler } from "lucide-react";
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
  /** compact = kartu Beranda & Katalog standar; full = katalog dengan spesifikasi teknis tambahan. */
  variant?: "compact" | "full";
  priority?: boolean;
  className?: string;
}

/** Kartu listing properti dengan rasio arsitektural 3:2 dan elevasi mewah (PRD WEB-H-02/03, WEB-P-04). */
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
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_32px_-8px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      <Link
        href={href}
        className="relative block aspect-[3/2] overflow-hidden border-b border-slate-100 bg-slate-100 ring-1 ring-inset ring-slate-900/10"
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
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Home className="size-12" aria-hidden />
          </div>
        )}

        {/* Gradasi Vignette Bawah untuk Kontras Badge Kaca */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

        {/* Lencana Tipe Properti Mengambang (Floating Glass-morphism) */}
        <span className="absolute bottom-3 left-3 rounded-full border border-slate-200/70 bg-white/90 px-3 py-1 font-display text-[11px] font-bold tracking-wide text-navy-950 shadow-xs backdrop-blur-md">
          {typeName}
        </span>

        {/* Indikator Jumlah Foto */}
        {p.image_count > 0 ? (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-md bg-navy-950/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Images className="size-3" aria-hidden />
            {p.image_count}
          </span>
        ) : null}

        {/* Lencana Khusus Varian Full */}
        {variant === "full" ? (
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-bold text-white shadow-sm",
                p.listing_type === "sale" ? "bg-navy-900/90" : "bg-blue-600/90",
              )}
            >
              {t(p.listing_type)}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-semibold shadow-sm",
                p.market_type === "primary"
                  ? "border border-amber-300 bg-amber-50 text-amber-800"
                  : "bg-white/90 text-slate-700",
              )}
            >
              {t(p.market_type)}
            </span>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-5.5">
        <div>
          {/* Harga Listing */}
          <div className="mb-1.5 text-xl font-extrabold tracking-tight text-blue-600 tabular-nums sm:text-2xl">
            {formatPriceFull(p.price, locale)}
            {period ? (
              <span className="font-sans text-xs font-semibold text-slate-400 sm:text-sm"> {period}</span>
            ) : null}
          </div>

          {/* Judul Properti */}
          <h3 className="mb-2 line-clamp-1 font-display text-base leading-snug font-bold text-slate-900 transition-colors group-hover:text-blue-600 sm:text-lg">
            <Link href={href}>{p.title}</Link>
          </h3>

          {/* Lokasi */}
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 sm:text-sm">
            <MapPin className="size-3.5 shrink-0 text-blue-500 sm:size-4" aria-hidden />
            <span className="truncate">{place}</span>
          </p>

          {variant === "full" ? <Specs p={p} locale={locale} /> : null}
        </div>

        {/* Baris Tombol Aksi (Dual CTA) */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3.5">
          <Link
            href={href}
            className="group/btn flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-bold text-slate-700 transition-all hover:border-blue-600 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95 sm:text-sm"
          >
            <span>{t("detail")}</span>
            <ArrowRight
              className="size-3.5 transition-transform group-hover/btn:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <a
            href={whatsappUrl(p.agent.whatsapp_number, propertyInquiryMessage(p, detailUrl, locale))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] px-3 py-2.5 text-center text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-[#15803D] hover:shadow-md hover:shadow-emerald-600/30 active:scale-95 sm:text-sm"
          >
            <WhatsAppIcon className="size-4 shrink-0 fill-current" />
            <span>{t("contactAgent")}</span>
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.68C7.02 10.88 7.9 12.04 8.02 12.2C8.14 12.37 9.73 14.83 12.18 15.89C12.76 16.14 13.22 16.29 13.57 16.4C14.16 16.59 14.7 16.56 15.12 16.5C15.6 16.43 16.58 15.91 16.78 15.33C16.99 14.76 16.99 14.27 16.93 14.17C16.87 14.06 16.71 14 16.47 13.88C16.22 13.76 15.02 13.17 14.8 13.09C14.57 13.01 14.41 12.97 14.25 13.21C14.08 13.46 13.61 14.01 13.47 14.17C13.33 14.33 13.18 14.35 12.94 14.23C12.7 14.11 11.91 13.85 10.98 13.02C10.26 12.38 9.77 11.58 9.63 11.34C9.49 11.1 9.61 10.96 9.73 10.84C9.84 10.74 9.98 10.56 10.1 10.42C10.22 10.28 10.26 10.17 10.34 10.01C10.42 9.85 10.38 9.71 10.32 9.59C10.26 9.47 9.77 8.27 9.57 7.78C9.37 7.31 9.17 7.37 9.02 7.37C8.88 7.36 8.71 7.33 8.53 7.33Z" />
    </svg>
  );
}
