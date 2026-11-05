import Image from "next/image";
import { useTranslations } from "next-intl";

import type { Locale } from "@/i18n/routing";
import { formatPriceFull } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import type { PropertyDetail } from "@/types/property";

interface Props {
  property: PropertyDetail;
  locale: Locale;
}

export function PropertyDetailSidebar({ property: p, locale }: Props) {
  const t = useTranslations("propertyDetail");
  const tCommon = useTranslations("common");

  // Format harga properti
  const formattedPrice = formatPriceFull(p.price, locale);
  const period =
    p.rent_period === "monthly"
      ? tCommon("perMonth")
      : p.rent_period === "yearly"
        ? tCommon("perYear")
        : null;

  // Format pesan WhatsApp
  const waMessage = t("whatsappPrefill", {
    agentName: p.agent.name,
    title: p.title,
    code: p.code,
  });

  const waLink = whatsappUrl(p.agent.whatsapp_number, waMessage);

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      {/* Kartu Utama Harga & Agen */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
        {/* Harga */}
        <div>
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {t("propertyPrice")}
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-2xl font-extrabold tracking-tight text-navy-900 lg:text-3xl">
              {formattedPrice}
            </span>
            {period && <span className="text-sm font-semibold text-slate-500">{period}</span>}
          </div>
        </div>

        {/* Garis Pemisah */}
        <hr className="my-5 border-slate-100" />

        {/* Profil Agen */}
        <div className="mb-6 flex items-center gap-3.5">
          <div className="relative">
            {p.agent.photo_url ? (
              <div className="relative size-12 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-100">
                <Image src={p.agent.photo_url} alt={p.agent.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-100 font-bold text-blue-700">
                {p.agent.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
            {/* Status Online Indicator Dot */}
            <span className="absolute right-0 bottom-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-bold text-navy-900">{p.agent.name}</h3>
            <p className="truncate text-xs font-semibold text-blue-600">
              {t("agentTitle")} • {p.location.district ?? "Batam"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{t("propertiesSold", { count: 48 })}</p>
          </div>
        </div>

        {/* Tombol Hubungi Agen (CTA disesuaikan dengan Landing Page) */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-center text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-[#15803D] hover:shadow-md hover:shadow-emerald-600/30 active:scale-98"
        >
          <WhatsAppIcon className="size-5 shrink-0 fill-current transition-transform duration-300 group-hover:scale-110" />
          <span>{tCommon("contactAgent")}</span>
        </a>
      </div>
    </aside>
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
