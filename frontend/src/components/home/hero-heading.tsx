import { getTranslations } from "next-intl/server";

import { AnimatedWords } from "@/components/common/animated-words";

const STAGGER = 70;

/**
 * Judul + subjudul hero (WEB-H-01) dengan animasi teks per kata.
 * Dipakai di Beranda (h1) dan katalog properti.
 */
export async function HeroHeading() {
  const t = await getTranslations("home");
  const title = t("heroTitle");
  const accent = t("heroTitleAccent");
  const suffix = t("heroTitleSuffix");

  const titleWords = title.split(/\s+/).filter(Boolean).length;
  const accentWords = accent.split(/\s+/).filter(Boolean).length;
  const totalWords = titleWords + accentWords + suffix.split(/\s+/).filter(Boolean).length;
  // Subjudul & kotak pencarian muncul tepat setelah kata terakhir mulai terbit.
  const afterTitle = totalWords * STAGGER + 150;

  return (
    <div className="max-w-4xl space-y-4 lg:max-w-5xl">
      <h1 className="font-display text-[2rem] leading-[1.15] font-extrabold tracking-tight text-balance sm:text-display-mobile md:text-display lg:text-[3.25rem]">
        <AnimatedWords text={title} stagger={STAGGER} /> <br className="hidden sm:inline" />
        <AnimatedWords
          text={accent}
          startIndex={titleWords}
          stagger={STAGGER}
          wordClassName="font-accent font-normal italic text-shimmer"
        />{" "}
        <AnimatedWords text={suffix} startIndex={titleWords + accentWords} stagger={STAGGER} />
      </h1>
      <p
        className="max-w-2xl animate-fade-up pt-1 text-base leading-relaxed font-normal text-slate-300 sm:text-lg"
        style={{ animationDelay: `${afterTitle}ms` }}
      >
        {t("heroSubtitle")}
      </p>
    </div>
  );
}
