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

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  heading: ReactNode;
  seeAllHref: { pathname: "/properties"; query: Record<string, string> };
  /** Kartu listing (dirender di server, dibungkus slide di sini). */
  children: ReactNode;
  variant?: "light" | "tinted";
}

/** Section carousel listing Beranda (PRD WEB-H-02/03, DESIGN.md §0). */
export function PropertyCarousel({ heading, seeAllHref, children, variant = "light" }: Props) {
  const t = useTranslations("common");
  const [ref, api] = useEmblaCarousel({ align: "start", slidesToScroll: 1, loop: true });
  const [canPrev, setCanPrev] = useState(true);
  const [canNext, setCanNext] = useState(true);

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
      className={cn("py-16 md:py-20", variant === "tinted" && "border-y border-blue-100/60 bg-blue-50/75")}
    >
      <div className="container-page">
        {/* Header bar: Judul di kiri, Lihat Semua di kanan */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          {heading}
          <div>
            <Link
              href={seeAllHref}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-blue-100 px-5 py-2.5 font-display text-body-sm font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-600 hover:text-white active:scale-95",
                variant === "tinted" ? "bg-white" : "bg-blue-50",
              )}
            >
              {t("seeAll")}
              <ArrowRight className="size-[18px]" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Carousel Area dengan Tombol Slide di Kiri dan Kanan */}
        <div className="relative">
          {/* Tombol Geser Kiri */}
          <button
            type="button"
            className={cn(
              "absolute top-1/2 -left-3 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-lg transition-all duration-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white active:scale-95 sm:-left-5",
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
            <div className="-ml-6 flex touch-pan-y">
              {slides.map((child, idx) => (
                <div
                  key={idx}
                  className="flex min-w-0 shrink-0 grow-0 basis-[85%] flex-col pl-6 sm:basis-1/2 lg:basis-1/3"
                >
                  {child}
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Geser Kanan */}
          <button
            type="button"
            className={cn(
              "absolute top-1/2 -right-3 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-lg transition-all duration-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white active:scale-95 sm:-right-5",
              !canNext && "pointer-events-none opacity-40",
            )}
            onClick={() => api?.scrollNext()}
            disabled={!canNext}
            aria-label={t("next")}
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
