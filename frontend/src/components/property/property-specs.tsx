import {
  Bath,
  BedDouble,
  LandPlot,
  Layers,
  MapPin,
  Ruler,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { Locale } from "@/i18n/routing";
import type { PropertyDetail } from "@/types/property";

interface Props {
  property: PropertyDetail;
  locale: Locale;
}

export function PropertySpecs({ property: p, locale }: Props) {
  const t = useTranslations("propertyDetail");

  const place = [p.location.district, p.location.city.name, p.location.province.name]
    .filter(Boolean)
    .join(", ");

  const typeName = locale === "id" ? p.property_type.name_id : p.property_type.name_en;
  const isLand = p.property_type.slug === "tanah";

  // Format nilai aktual dari database tanpa fallback palsu
  const landAreaVal = p.land_area != null && p.land_area > 0 ? t("landArea", { area: p.land_area }) : "—";
  const buildingAreaVal =
    p.building_area != null && p.building_area > 0 ? t("buildingArea", { area: p.building_area }) : "—";
  const floorsVal = p.floors != null && p.floors > 0 ? t("floors", { n: p.floors }) : "—";
  const electricityVal =
    p.electricity_va != null && p.electricity_va > 0
      ? t("electricity", { va: p.electricity_va.toLocaleString("id-ID") })
      : "—";
  const certificateVal = p.certificate ? p.certificate.toUpperCase() : "—";
  const furnishingVal = p.furnishing ? p.furnishing.replace(/_/g, " ").toUpperCase() : "—";
  const facingVal = p.facing ? p.facing.toUpperCase() : "—";
  const parkingVal = p.carports != null && p.carports > 0 ? t("cars", { n: p.carports }) : "—";
  const waterVal = p.water_source ? p.water_source : "—";

  const quickBadges = [
    !isLand && p.bedrooms != null && p.bedrooms > 0
      ? {
          key: "bedrooms",
          icon: BedDouble,
          value: t("bedrooms", { n: p.bedrooms }),
          label: t("bedroomsLabel"),
        }
      : null,
    !isLand && p.bathrooms != null && p.bathrooms > 0
      ? {
          key: "bathrooms",
          icon: Bath,
          value: t("bathrooms", { n: p.bathrooms }),
          label: t("bathroomsLabel"),
        }
      : null,
    p.land_area != null && p.land_area > 0
      ? {
          key: "landArea",
          icon: LandPlot,
          value: landAreaVal,
          label: t("landAreaLabel"),
        }
      : null,
    !isLand && p.building_area != null && p.building_area > 0
      ? {
          key: "buildingArea",
          icon: Ruler,
          value: buildingAreaVal,
          label: t("buildingAreaLabel"),
        }
      : null,
    !isLand && p.floors != null && p.floors > 0
      ? {
          key: "floors",
          icon: Layers,
          value: floorsVal,
          label: t("floorsLabel"),
        }
      : null,
    !isLand && p.electricity_va != null && p.electricity_va > 0
      ? {
          key: "electricity",
          icon: Zap,
          value: electricityVal,
          label: t("electricityLabel"),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
      {/* Judul & Kode Properti */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            {typeName}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {t("code", { code: p.code })}
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900 md:text-3xl leading-snug">
          {p.title}
        </h1>
        <div className="mt-2.5 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="size-4 shrink-0 text-blue-600" />
          <span>{place}</span>
        </div>
      </div>

      {/* Quick Highlight Badges (hanya menampilkan nilai yang tersedia & relevan) */}
      {quickBadges.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6 md:gap-3">
          {quickBadges.map(({ key, icon: Icon, value, label }) => (
            <div
              key={key}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center transition-colors hover:border-blue-100 hover:bg-blue-50/50"
            >
              <Icon className="mb-1.5 size-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-800">{value}</span>
              <span className="text-[11px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Grid Tabel Spesifikasi Detail 2-Kolom */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <h2 className="mb-4 text-base font-bold text-navy-900">
          {t("overviewAndSpecs")}
        </h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-3.5 text-sm md:grid-cols-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("specPropertyType")}</span>
            <span className="font-semibold text-slate-800">{typeName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("specCertificate")}</span>
            <span className="font-semibold text-slate-800">{certificateVal}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("landAreaLabel")}</span>
            <span className="font-semibold text-slate-800">{landAreaVal}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("specFacing")}</span>
            <span className="font-semibold text-slate-800">{facingVal}</span>
          </div>

          {!isLand && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">{t("buildingAreaLabel")}</span>
                <span className="font-semibold text-slate-800">{buildingAreaVal}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">{t("specFurnishing")}</span>
                <span className="font-semibold text-slate-800">{furnishingVal}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">{t("electricityLabel")}</span>
                <span className="font-semibold text-slate-800">{electricityVal}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">{t("specCarport")}</span>
                <span className="font-semibold text-slate-800">{parkingVal}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">{t("floorsLabel")}</span>
                <span className="font-semibold text-slate-800">{floorsVal}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">{t("specWater")}</span>
                <span className="font-semibold text-slate-800">{waterVal}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
