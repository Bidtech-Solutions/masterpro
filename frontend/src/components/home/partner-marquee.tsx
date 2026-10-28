import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { SectionHeading } from "@/components/common/section-heading";
import { partners } from "@/config/partners";

/** Marquee logo mitra bank (PRD WEB-H-04). Daftar diulang dua kali untuk loop mulus. */
export async function PartnerMarquee() {
  const t = await getTranslations("home");
  return (
    <section className="overflow-hidden border-b border-slate-200 bg-white py-16">
      <div className="container-page">
        <SectionHeading
          title={t("partnersTitle")}
          accent={t("partnersAccent")}
          align="center"
          className="mb-10"
        />
        <div className="group relative mx-auto w-full max-w-6xl overflow-hidden py-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent md:w-36" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent md:w-36" />
          <div className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center gap-10 px-5" aria-hidden={copy === 1}>
                {partners.map((p) => (
                  <li key={p.name} className="flex h-20 w-44 items-center justify-center">
                    <Image
                      src={p.logo}
                      alt={copy === 0 ? p.name : ""}
                      width={p.width}
                      height={p.height}
                      className="h-12 w-auto object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:h-14"
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
