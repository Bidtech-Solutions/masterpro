"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Compass, ExternalLink, MapPin, Ship, ShoppingBag } from "lucide-react";

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
  cityName?: string;
  provinceName?: string;
}

export function PropertyLocationMap({
  latitude,
  longitude,
  district = "Batam Kota",
  cityName = "Kota Batam",
  provinceName = "Kepulauan Riau",
}: Props) {
  const t = useTranslations("propertyDetail");
  const [interactive, setInteractive] = useState(false);

  const lat = latitude ?? 1.129;
  const lng = longitude ?? 104.053;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm md:p-4">
      <div className="relative aspect-[16/8] w-full overflow-hidden rounded-xl border border-slate-200/90 bg-slate-900 md:aspect-[21/8]">
        {interactive ? (
          /* Peta Interaktif OpenStreetMap */
          <iframe
            title={t("mapTitle")}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.008}%2C${lng + 0.015}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lng}`}
            className="h-full w-full border-0"
            loading="lazy"
          />
        ) : (
          /* Citra Satelit Batam Centre Asli (1:1 Sesuai Gambar Referensi) */
          <>
            <Image
              src="/images/batam-centre-map.jpg"
              alt={`${t("mapTitle")} ${district}, ${cityName}, ${provinceName}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />

            {/* Landmark 1: Terminal Ferry Batam Centre (di area perairan atas) */}
            <div className="absolute top-3.5 right-14 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-navy-950/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-md md:top-4 md:right-28 md:px-3 md:text-xs">
              <Ship className="size-3 text-cyan-400 md:size-3.5" />
              <span>{t("mapLandmarkFerry")}</span>
            </div>

            {/* Landmark 2: Mega Mall Batam Centre */}
            <div className="absolute top-1/2 right-4 z-10 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-navy-950/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-md sm:right-12 md:right-20 md:px-3 md:text-xs">
              <ShoppingBag className="size-3 text-amber-400 md:size-3.5" />
              <span>{t("mapLandmarkMall")}</span>
            </div>

            {/* Pin Lokasi Properti (Tengah Cluster Batam Centre) */}
            <div className="absolute top-[58%] left-[42%] z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="absolute size-9 animate-ping rounded-full bg-blue-500/40" />
                <div className="relative flex size-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-xl">
                  <MapPin className="size-4.5" />
                </div>
              </div>
              <div className="mt-1 rounded-lg border border-white/25 bg-navy-900/90 px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white shadow-lg backdrop-blur-md md:text-[11px]">
                {t("mapPropertyLocation")} • {district}
              </div>
            </div>
          </>
        )}

        {/* Tombol Kontrol Kanan Atas: Toggle Satelit/Interaktif & Buka di Google Maps */}
        <div className="absolute top-3.5 right-3.5 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInteractive(!interactive)}
            className="flex size-8 items-center justify-center rounded-full border border-white/30 bg-navy-950/80 text-white shadow-md backdrop-blur-md transition hover:bg-navy-950"
            title={interactive ? t("mapSatelliteMode") : t("mapInteractiveMode")}
            aria-label={t("mapToggleMode")}
          >
            <Compass className="size-4 text-cyan-400" />
          </button>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-navy-950/80 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition hover:bg-navy-950"
            title={t("mapOpenGoogleMaps")}
          >
            <span>{t("mapOpenGoogleMaps")}</span>
            <ExternalLink className="size-3 text-slate-300" />
          </a>
        </div>
      </div>
    </div>
  );
}
