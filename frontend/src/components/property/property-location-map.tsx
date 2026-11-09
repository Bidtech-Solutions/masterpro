import { ExternalLink, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { SatelliteMap } from "@/components/common/satellite-map";
import { serviceCity } from "@/config/locations";
import { googleMapsUrl } from "@/lib/maps";

interface Props {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  district: string | null;
  cityName: string;
  provinceName: string;
}

/** Peta lokasi satelit di detail properti (PRD WEB-D-08). */
export function PropertyLocationMap({
  latitude,
  longitude,
  address,
  district,
  cityName,
  provinceName,
}: Props) {
  const t = useTranslations("propertyDetail");

  const hasPoint = latitude !== null && longitude !== null;
  const point = hasPoint ? { lat: latitude, lng: longitude } : serviceCity.center;
  const place = [district, cityName, provinceName].filter(Boolean).join(", ");

  return (
    <section
      aria-labelledby="property-location-title"
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <MapPin className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id="property-location-title" className="font-display text-xl font-bold text-navy-900">
              {t("mapTitle")}
            </h2>
            <p className="mt-1 text-xs text-slate-500 md:text-sm">
              {address ? `${address}, ${place}` : place}
            </p>
          </div>
        </div>
        <a
          href={googleMapsUrl(point)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy-900 shadow-2xs transition hover:border-blue-300 hover:text-blue-700"
        >
          {t("mapOpenGoogleMaps")}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200/90 sm:aspect-[16/9] md:aspect-[21/9]">
        <SatelliteMap latitude={point.lat} longitude={point.lng} label={`${t("mapTitle")} — ${place}`} />
      </div>

      {!hasPoint && <p className="mt-3 text-xs text-slate-500">{t("mapApproximate", { city: cityName })}</p>}
    </section>
  );
}
