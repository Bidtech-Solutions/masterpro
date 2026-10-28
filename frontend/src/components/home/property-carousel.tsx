"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Children, useCallback, useEffect, useState, type ReactNode } from "react";

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
  const [ref, api] = useEmblaCarousel({ align: "start", slidesToScroll: 1, containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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

  const navBtn =
    "flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-navy-900 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-40";

  return (
    <section
      className={cn("py-16 md:py-20", variant === "tinted" && "border-y border-blue-100/60 bg-blue-50/75")}
    >
      <div className="container-page">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          {heading}
          <div className="flex items-center gap-3">
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
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                className={navBtn}
                onClick={() => api?.scrollPrev()}
                disabled={!canPrev}
                aria-label={t("previous")}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                className={navBtn}
                onClick={() => api?.scrollNext()}
                disabled={!canNext}
                aria-label={t("next")}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
        <div className="-mx-3 overflow-hidden px-3 py-2" ref={ref}>
          <div className="-ml-6 flex touch-pan-y">
            {Children.map(children, (child) => (
              <div className="min-w-0 shrink-0 grow-0 basis-[85%] pl-6 sm:basis-1/2 lg:basis-1/3">
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
