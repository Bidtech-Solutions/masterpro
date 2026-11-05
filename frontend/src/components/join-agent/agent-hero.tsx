import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { site } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function AgentHero() {
  const t = useTranslations("joinAgent");

  const waHref = whatsappUrl(site.contact.whatsappAdmin, t("whatsappMessage"));

  return (
    <section className="relative overflow-hidden bg-navy-950 py-16 text-white md:py-24 lg:py-28">
      {/* Foto Latar Belakang Arsitektur Modern */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="MasterPro Agent Career"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Overlay Gradien Gelap Elegan */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/85 to-navy-900/80" />
        <div className="absolute inset-0 bg-navy-950/40" />
      </div>

      <div className="relative z-10 container-page">
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl">
          {/* Judul Utama memanjang horizontal tanpa wrap vertikal berlebih */}
          <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[42px] lg:leading-[1.18] xl:text-[48px]">
            <span className="inline lg:block">{t("heroTitlePrefix")} </span>
            <span className="inline lg:block">
              {t("heroTitleSuffix")}{" "}
              <span className="font-serif font-normal whitespace-nowrap text-sky-400 italic drop-shadow-sm">
                {t("heroTitleHighlight")}
              </span>
            </span>
          </h1>

          {/* Subjudul */}
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-200 md:text-lg">
            {t("heroSubtitle")}
          </p>

          {/* Tombol Aksi (CTA WhatsApp & Scroll ke Komisi) */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#16A34A] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-[#15803D] hover:shadow-emerald-950/30 active:scale-98"
            >
              <WhatsAppIcon className="size-5 shrink-0 fill-current transition-transform duration-300 group-hover:scale-110" />
              <span>{t("ctaWhatsapp")}</span>
            </a>

            <a
              href="#komisi"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-6 py-3.5 text-sm font-bold text-slate-800 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:text-blue-600 active:scale-98"
            >
              <span>{t("ctaLearnCommission")}</span>
              <ChevronDown className="size-4 text-slate-600" />
            </a>
          </div>

          {/* 3 Statistik Utama */}
          <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-white/15 pt-8 sm:gap-14">
            <div>
              <div className="font-display text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {t("statsAgentsValue")}
              </div>
              <div className="mt-0.5 text-xs font-medium text-slate-300 md:text-sm">
                {t("statsAgentsLabel")}
              </div>
            </div>

            <div className="h-9 w-px bg-white/20" aria-hidden="true" />

            <div>
              <div className="font-display text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {t("statsVolumeValue")}
              </div>
              <div className="mt-0.5 text-xs font-medium text-slate-300 md:text-sm">
                {t("statsVolumeLabel")}
              </div>
            </div>

            <div className="h-9 w-px bg-white/20" aria-hidden="true" />

            <div>
              <div className="font-display text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {t("statsSatisfactionValue")}
              </div>
              <div className="mt-0.5 text-xs font-medium text-slate-300 md:text-sm">
                {t("statsSatisfactionLabel")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
