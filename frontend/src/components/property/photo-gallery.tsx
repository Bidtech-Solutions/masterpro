"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

import type { PropertyDetailImage } from "@/types/property";

interface Props {
  images: PropertyDetailImage[];
  title: string;
}

export function PhotoGallery({ images, title }: Props) {
  const t = useTranslations("propertyDetail");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fullGallery = useMemo(() => [...(images || [])], [images]);

  if (fullGallery.length === 0) {
    return (
      <div className="relative flex aspect-[21/9] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 text-slate-400 ring-1 ring-slate-900/10 ring-inset">
        <Images className="size-12" />
      </div>
    );
  }

  const heroPhoto = fullGallery[0]!;
  const rightPhotos = fullGallery.slice(1, 5);
  const additionalCount = Math.max(0, fullGallery.length - 5);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextLightbox = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % fullGallery.length);
    }
  };
  const prevLightbox = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + fullGallery.length) % fullGallery.length);
    }
  };

  const activePhoto =
    lightboxIndex !== null && fullGallery[lightboxIndex] ? fullGallery[lightboxIndex] : null;

  return (
    <>
      <section className="grid grid-cols-1 gap-3 md:h-[480px] md:grid-cols-12 md:gap-3.5 lg:h-[520px]">
        {/* Foto Utama / Kiri (Besar) */}
        <div
          onClick={() => openLightbox(0)}
          className={`group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm ring-1 ring-slate-900/10 transition-shadow ring-inset hover:shadow-md md:aspect-auto md:h-full md:rounded-3xl ${
            rightPhotos.length === 0 ? "md:col-span-12" : "md:col-span-7"
          }`}
        >
          <Image
            src={heroPhoto.url}
            alt={`${title} - Foto Utama`}
            fill
            priority
            sizes={rightPhotos.length === 0 ? "100vw" : "(max-width: 768px) 100vw, 58vw"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Top Scrim Gradient (Cinematic Vignette) - kontras universal untuk semua warna gambar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/85 via-slate-950/40 to-transparent sm:h-40 md:h-44" />

          {/* Judul Properti (Universal Contrast: Putih Berbayangan di atas Scrim Gelap) */}
          <div className="pointer-events-none absolute top-4 left-4 z-10 max-w-[88%] select-none sm:top-5 sm:left-5 md:top-6 md:left-6 md:max-w-lg">
            <h2 className="line-clamp-2 font-display text-base leading-tight font-extrabold tracking-tight text-white drop-shadow-md sm:text-lg md:text-xl lg:text-2xl">
              {title}
            </h2>
          </div>

          {/* Badge jumlah total foto di pojok kiri bawah gambar utama */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(0);
            }}
            className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-slate-950/90"
          >
            <Images className="size-3.5 text-cyan-300" />
            <span>{fullGallery.length} Foto</span>
          </button>

          <div className="absolute inset-0 bg-slate-900/10 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Kolom Kanan: Gambar Sekunder Selalu Kotak Kecil (Grid 2x2) */}
        {rightPhotos.length > 0 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-3 md:col-span-5 md:h-full md:gap-3.5">
            {rightPhotos.map((photo, idx) => {
              const galleryIdx = idx + 1;
              const isLastSlotWithMore = idx === 3 && additionalCount > 0;

              return (
                <div
                  key={photo.id || galleryIdx}
                  onClick={() => openLightbox(galleryIdx)}
                  className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm ring-1 ring-slate-900/10 transition-shadow ring-inset hover:shadow-md md:aspect-auto md:h-full md:rounded-3xl"
                >
                  <Image
                    src={photo.url}
                    alt={`${title} - Foto ${galleryIdx + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 22vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {isLastSlotWithMore ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/60 p-3 text-center text-white backdrop-blur-[1.5px] transition-colors group-hover:bg-slate-950/70">
                      <div className="mb-1.5 flex size-10 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)] backdrop-blur-md md:size-11">
                        <Images className="size-5 md:size-5.5" />
                      </div>
                      <span className="font-display text-base font-extrabold tracking-wide text-white drop-shadow-sm md:text-lg lg:text-xl">
                        {t("photoCountOverlay", { count: additionalCount })}
                      </span>
                      <span className="mt-0.5 text-[11px] font-medium text-slate-200/90 drop-shadow-xs md:text-xs">
                        {t("viewAllPhotos")}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Lightbox Modal Resolusi Penuh */}
      {lightboxIndex !== null && activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
        >
          {/* Header Lightbox */}
          <div className="absolute top-4 right-4 left-4 z-20 flex items-center justify-between text-white md:top-6 md:right-6 md:left-6">
            <div className="text-sm font-semibold tracking-wide text-slate-300">
              {lightboxIndex + 1} / {fullGallery.length} • {title}
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="cursor-pointer rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label={t("close")}
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Tombol Navigasi Sebelumnya */}
          <button
            type="button"
            onClick={prevLightbox}
            className="absolute left-3 z-20 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25 md:left-6"
            aria-label="Previous"
          >
            <ChevronLeft className="size-6 md:size-8" />
          </button>

          {/* Area Foto Utama Resolusi Penuh */}
          <div className="relative h-[80vh] w-[90vw] max-w-6xl">
            <Image
              src={activePhoto.url}
              alt={`${title} - Foto ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="95vw"
            />
          </div>

          {/* Tombol Navigasi Berikutnya */}
          <button
            type="button"
            onClick={nextLightbox}
            className="absolute right-3 z-20 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25 md:right-6"
            aria-label="Next"
          >
            <ChevronRight className="size-6 md:size-8" />
          </button>
        </div>
      )}
    </>
  );
}
