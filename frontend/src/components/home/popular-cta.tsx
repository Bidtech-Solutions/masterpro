import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Banner CTA properti populer (PRD WEB-H-05, DESIGN.md §0). */
export async function PopularCta() {
  const t = await getTranslations("home");
  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-xl bg-brand-gradient p-10 text-white shadow-popover md:p-14">
          <div className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full border-[28px] border-white/10" />
          <div className="pointer-events-none absolute right-32 -bottom-20 size-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute bottom-0 -left-12 size-44 rounded-full bg-sky-300/15 blur-xl" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-5/12 [mask-image:linear-gradient(to_right,transparent,rgba(0,0,0,0.4)_30%,black)] md:block">
            <Image
              src="/images/hero.jpg"
              alt={t("heroImageAlt")}
              fill
              sizes="40vw"
              className="object-cover opacity-30 mix-blend-overlay"
            />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="mb-4 font-display text-display-mobile font-extrabold tracking-tight md:text-h1">
              {t("popularTitle")}
            </h2>
            <p className="mb-8 max-w-xl text-body-lg text-blue-50">{t("popularSubtitle")}</p>
            <Link
              href={{ pathname: "/properties", query: { sort: "popular" } }}
              className="inline-flex items-center gap-2 rounded-md bg-white px-7 py-3.5 font-display text-body-sm font-bold text-navy-950 shadow-card transition-all hover:bg-slate-50 hover:shadow-card-hover active:scale-95"
            >
              {t("popularCta")}
              <ArrowRight className="size-[18px]" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
