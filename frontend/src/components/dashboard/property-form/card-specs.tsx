"use client";

import { Home } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PropertyTypeSlug } from "./card-basic-info";

interface CardSpecsProps {
  propertyType: PropertyTypeSlug;
  landArea: number | "";
  setLandArea: (area: number | "") => void;
  buildingArea: number | "";
  setBuildingArea: (area: number | "") => void;
  bedrooms: number | "";
  setBedrooms: (n: number | "") => void;
  bathrooms: number | "";
  setBathrooms: (n: number | "") => void;
  maidBedrooms: number | "";
  setMaidBedrooms: (n: number | "") => void;
  floors: string;
  setFloors: (f: string) => void;
  carports: string;
  setCarports: (c: string) => void;
  electricity: string;
  setElectricity: (e: string) => void;
  waterSource: string;
  setWaterSource: (w: string) => void;
  certificate: string;
  setCertificate: (cert: string) => void;
  furnishing: string;
  setFurnishing: (furn: string) => void;
  facing: string;
  setFacing: (facing: string) => void;
  yearBuilt: string;
  setYearBuilt: (year: string) => void;
}

export function CardSpecs({
  propertyType,
  landArea,
  setLandArea,
  buildingArea,
  setBuildingArea,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  maidBedrooms,
  setMaidBedrooms,
  floors,
  setFloors,
  carports,
  setCarports,
  electricity,
  setElectricity,
  waterSource,
  setWaterSource,
  certificate,
  setCertificate,
  furnishing,
  setFurnishing,
  facing,
  setFacing,
  yearBuilt,
  setYearBuilt,
}: CardSpecsProps) {
  const t = useTranslations("dashboard");

  const isApartment = propertyType === "apartemen";
  const isLand = propertyType === "tanah";
  const isKos = propertyType === "kos";

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-[#EBF5FF] text-[#2563EB]">
          <Home className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("cardSpecsTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("cardSpecsSubtitle")}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Row 1: LT & LB */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!isApartment && (
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("landArea")} *</label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min={1}
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="120"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-3.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
                />
                <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  m²
                </span>
              </div>
            </div>
          )}

          {!isLand && (
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("buildingArea")} *</label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min={1}
                  value={buildingArea}
                  onChange={(e) => setBuildingArea(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="140"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-3.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
                />
                <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  m²
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: KT & KM */}
        {!isLand && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                {isKos ? "Total Kamar Kos" : t("bedrooms")} *
              </label>
              <input
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value ? parseInt(e.target.value, 10) : "")}
                placeholder="3"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">{t("bathrooms")} *</label>
              <input
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value ? parseInt(e.target.value, 10) : "")}
                placeholder="2"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Row 3: Kamar Pembantu & Jumlah Lantai */}
        {!isLand && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("maidBedrooms")}</label>
              <input
                type="number"
                min={0}
                value={maidBedrooms}
                onChange={(e) => setMaidBedrooms(e.target.value ? parseInt(e.target.value, 10) : "")}
                placeholder="1"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                {isApartment ? "Lantai Unit (Tower)" : t("floors")}
              </label>
              <input
                type="text"
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                placeholder={isApartment ? "Lantai 15" : "2 Lantai"}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Row 4: Carport & Daya Listrik */}
        {!isLand && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("carportCapacity")}</label>
              <input
                type="text"
                value={carports}
                onChange={(e) => setCarports(e.target.value)}
                placeholder="2 Mobil"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">{t("electricity")}</label>
              <select
                value={electricity}
                onChange={(e) => setElectricity(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="2200">2.200 VA</option>
                <option value="1300">1.300 VA</option>
                <option value="3500">3.500 VA</option>
                <option value="4400">4.400 VA</option>
                <option value="5500">5.500 VA</option>
                <option value="7700">7.700 VA+</option>
              </select>
            </div>
          </div>
        )}

        {/* Row 5: Sumber Air & Legalitas Sertifikat */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!isLand && (
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("waterSource")}</label>
              <select
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="PDAM / ATB Batam">PDAM / ATB Batam</option>
                <option value="Sumur Bor / Tanah">Sumur Bor / Tanah</option>
                <option value="WTP Pengelola">WTP Pengelola Kawasan</option>
              </select>
            </div>
          )}

          <div className={isLand ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-bold text-slate-700">{t("certificateLegal")} *</label>
            <select
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
            >
              <option value="shm">Sertifikat Hak Milik (SHM)</option>
              <option value="hgb">Hak Guna Bangunan (HGB)</option>
              <option value="strata">Strata Title (Hak Milik Apartemen)</option>
              <option value="girik">Girik / Adat</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Row 6: Perabotan & Hadap Bangunan */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!isLand && (
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("furnishing")}</label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="semi_furnished">Semi Furnished</option>
                <option value="unfurnished">Unfurnished (Kosongan)</option>
                <option value="full_furnished">Fully Furnished (Lengkap Siap Huni)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700">{t("facing")}</label>
            <select
              value={facing}
              onChange={(e) => setFacing(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
            >
              <option value="north">Utara</option>
              <option value="south">Selatan</option>
              <option value="east">Timur</option>
              <option value="west">Barat</option>
              <option value="northeast">Timur Laut</option>
              <option value="northwest">Barat Laut</option>
              <option value="southeast">Tenggara</option>
              <option value="southwest">Barat Daya</option>
            </select>
          </div>
        </div>

        {/* Row 7: Tahun Dibangun / Renovasi */}
        {!isLand && (
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("yearBuilt")}</label>
            <input
              type="text"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
              placeholder="2025"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
