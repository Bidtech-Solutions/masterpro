import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export function PopularBanner() {
  const t = useTranslations("propertyDetail");

  return (
    <section className="relative my-16 overflow-hidden rounded-3xl bg-[#0B6BEA] p-8 text-white shadow-xl md:my-20 md:p-12">
      {/* Foto Rumah Mewah Latar Belakang (Terlihat jelas di sisi kanan) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-3/4 md:w-3/5 lg:w-1/2">
        <Image
          src="/images/hero.jpg"
          alt="Properti Populer"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-[65%_center]"
        />
        {/* Gradien biru halus di sisi kiri agar menyatu dengan background biru #0B6BEA tanpa menggelapkan rumah di kanan */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B6BEA] from-5% via-[#0B6BEA]/60 via-30% to-transparent" />
      </div>

      <div className="relative z-10 max-w-xl md:max-w-2xl">
        <h2 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-white drop-shadow-xs md:text-3xl lg:text-4xl">
          {t("popularBannerTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-blue-50 drop-shadow-xs md:text-base">
          {t("popularBannerDesc")}
        </p>
        <div className="mt-6">
          <Link
            href={{ pathname: "/properties", query: { sort: "popular" } }}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-md shadow-black/10 transition-all hover:bg-blue-50 active:scale-98"
          >
            <span>{t("popularBannerCta")}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
