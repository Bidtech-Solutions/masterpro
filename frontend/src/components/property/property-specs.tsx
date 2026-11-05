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

  // Format nilai dinamis atau fallback cerdas
  const bedroomsVal = p.bedrooms ?? 3;
  const bathroomsVal = p.bathrooms ?? 2;
  const landAreaVal = p.land_area ? `${p.land_area} m²` : "120 m²";
  const buildingAreaVal = p.building_area ? `${p.building_area} m²` : "140 m²";
  const floorsVal = p.floors ? `${p.floors} Lantai` : "2 Lantai";
  const electricityVal = p.electricity_va ? `${p.electricity_va.toLocaleString()} VA` : "2.200 VA";
  const certificateVal = p.certificate ? p.certificate.toUpperCase() : "SHM (Hak Milik)";
  const furnishingVal = p.furnishing ? p.furnishing.replace(/_/g, " ").toUpperCase() : "Semi Furnished";
  const facingVal = p.facing ? p.facing.toUpperCase() : "Utara";
  const parkingVal = p.carports ? `${p.carports} Mobil` : "2 Mobil";

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

      {/* 6 Quick Highlight Badges */}
      <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-6 md:gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center transition-colors hover:border-blue-100 hover:bg-blue-50/50">
          <BedDouble className="size-5 text-blue-600 mb-1.5" />
          <span className="text-sm font-bold text-slate-800">{bedroomsVal} KT</span>
          <span className="text-[11px] text-slate-500">{t("bedroomsLabel")}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center transition-colors hover:border-blue-100 hover:bg-blue-50/50">
          <Bath className="size-5 text-blue-600 mb-1.5" />
          <span className="text-sm font-bold text-slate-800">{bathroomsVal} KM</span>
          <span className="text-[11px] text-slate-500">{t("bathroomsLabel")}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center transition-colors hover:border-blue-100 hover:bg-blue-50/50">
          <LandPlot className="size-5 text-blue-600 mb-1.5" />
          <span className="text-sm font-bold text-slate-800">{landAreaVal}</span>
          <span className="text-[11px] text-slate-500">{t("landAreaLabel")}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center transition-colors hover:border-blue-100 hover:bg-blue-50/50">
          <Ruler className="size-5 text-blue-600 mb-1.5" />
          <span className="text-sm font-bold text-slate-800">{buildingAreaVal}</span>
          <span className="text-[11px] text-slate-500">{t("buildingAreaLabel")}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center transition-colors hover:border-blue-100 hover:bg-blue-50/50">
          <Layers className="size-5 text-blue-600 mb-1.5" />
          <span className="text-sm font-bold text-slate-800">{floorsVal}</span>
          <span className="text-[11px] text-slate-500">{t("floorsLabel")}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center transition-colors hover:border-blue-100 hover:bg-blue-50/50">
          <Zap className="size-5 text-blue-600 mb-1.5" />
          <span className="text-sm font-bold text-slate-800">{electricityVal}</span>
          <span className="text-[11px] text-slate-500">{t("electricityLabel")}</span>
        </div>
      </div>

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
            <span className="text-slate-500">{t("specFurnishing")}</span>
            <span className="font-semibold text-slate-800">{furnishingVal}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("buildingAreaLabel")}</span>
            <span className="font-semibold text-slate-800">{buildingAreaVal}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("specCarport")}</span>
            <span className="font-semibold text-slate-800">{parkingVal}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("electricityLabel")}</span>
            <span className="font-semibold text-slate-800">{electricityVal}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("specFacing")}</span>
            <span className="font-semibold text-slate-800">{facingVal}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("floorsLabel")}</span>
            <span className="font-semibold text-slate-800">{floorsVal}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">{t("specWater")}</span>
            <span className="font-semibold text-slate-800">{p.water_source ?? "PDAM Batam"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
