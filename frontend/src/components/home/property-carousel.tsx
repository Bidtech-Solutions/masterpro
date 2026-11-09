"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { Reveal } from "@/components/common/reveal";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  heading: ReactNode;
  seeAllHref: { pathname: "/properties"; query: Record<string, string> };
  /** Kartu listing (dirender di server, dibungkus slide di sini). */
  children: ReactNode;
  variant?: "light" | "tinted";
}

const mobileArrow =
  "flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-md transition-all duration-200 active:scale-95 active:bg-blue-600 active:text-white disabled:opacity-40";

/** Section carousel listing Beranda (PRD WEB-H-02/03, DESIGN.md §0). */
export function PropertyCarousel({ heading, seeAllHref, children, variant = "light" }: Props) {
  const t = useTranslations("common");
  const [ref, api] = useEmblaCarousel({ align: "start", slidesToScroll: 1, loop: true });
  const [canPrev, setCanPrev] = useState(true);
  const [canNext, setCanNext] = useState(true);
  const [selected, setSelected] = useState(0);

  const rawSlides = Children.toArray(children);
  const count = rawSlides.length;

  // Jika kartu listing ada 2 atau 3 (misal data demo sewa), gandakan kartu agar Embla memiliki
  // slide yang cukup (4 atau 6) untuk melakukan looping scroll tanpa batas.
  const slides =
    count > 1 && count <= 3
      ? [
          ...rawSlides,
          ...rawSlides.map((child, i) =>
            isValidElement(child)
              ? cloneElement(child, { key: `dup-${i}` } as Record<string, unknown>)
              : child,
          ),
        ]
      : rawSlides;

  const update = useCallback(() => {
    if (!api) return;
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
    setSelected(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const frame = requestAnimationFrame(update);
    api.on("select", update).on("reInit", update);
    return () => {
      cancelAnimationFrame(frame);
      api.off("select", update).off("reInit", update);
    };
  }, [api, update]);

  return (
    <section
      className={cn("py-12 md:py-20", variant === "tinted" && "border-y border-blue-100/60 bg-blue-50/75")}
    >
      <div className="container-page">
        {/* Header bar: Judul di kiri, Lihat Semua di kanan */}
        <Reveal className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 md:mb-8">
          <div className="min-w-0">{heading}</div>
          <div className="shrink-0">
            <Link
              href={seeAllHref}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-blue-100 px-4 py-2 font-display text-xs font-bold whitespace-nowrap text-blue-700 shadow-sm transition-all hover:bg-blue-600 hover:text-white active:scale-95 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-body-sm",
                variant === "tinted" ? "bg-white" : "bg-blue-50",
              )}
            >
              {t("seeAll")}
              <ArrowRight className="size-4 sm:size-[18px]" aria-hidden />
            </Link>
          </div>
        </Reveal>

        {/* Carousel Area dengan Tombol Slide di Kiri dan Kanan */}
        <div className="relative">
          {/* Tombol Geser Kiri */}
          <button
            type="button"
            className={cn(
              "absolute top-1/2 -left-3 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-lg transition-all duration-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white active:scale-95 sm:-left-5 sm:flex",
              !canPrev && "pointer-events-none opacity-40",
            )}
            onClick={() => api?.scrollPrev()}
            disabled={!canPrev}
            aria-label={t("previous")}
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>

          {/* Embla Viewport */}
          <div className="-mx-3 cursor-grab overflow-hidden px-3 py-2 active:cursor-grabbing" ref={ref}>
            <div className="-ml-4 flex touch-pan-y sm:-ml-6">
              {slides.map((child, idx) => (
                <div
                  key={idx}
                  className="flex min-w-0 shrink-0 grow-0 basis-[85%] flex-col pl-4 sm:basis-1/2 sm:pl-6 lg:basis-1/3"
                >
                  {/* 3 kartu pertama muncul berurutan; kartu yang digeser masuk langsung tampil tanpa jeda */}
                  <Reveal delay={idx < 3 ? idx * 110 : 0} className="flex h-full flex-col">
                    {child}
                  </Reveal>
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Geser Kanan */}
          <button
            type="button"
            className={cn(
              "absolute top-1/2 -right-3 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-lg transition-all duration-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white active:scale-95 sm:-right-5 sm:flex",
              !canNext && "pointer-events-none opacity-40",
            )}
            onClick={() => api?.scrollNext()}
            disabled={!canNext}
            aria-label={t("next")}
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
        </div>

        {/* Kontrol geser khusus mobile: panah + indikator titik di bawah carousel */}
        {count > 1 ? (
          <div className="mt-5 flex items-center justify-center gap-4 sm:hidden">
            <button
              type="button"
              className={mobileArrow}
              onClick={() => api?.scrollPrev()}
              disabled={!canPrev}
              aria-label={t("previous")}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <div className="flex items-center gap-1.5">
              {rawSlides.map((_, i) => {
                const active = selected % count === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`${i + 1} / ${count}`}
                    aria-current={active}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      active ? "w-6 bg-blue-600" : "w-2 bg-slate-300 hover:bg-slate-400",
                    )}
                  />
                );
              })}
            </div>
            <button
              type="button"
              className={mobileArrow}
              onClick={() => api?.scrollNext()}
              disabled={!canNext}
              aria-label={t("next")}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
