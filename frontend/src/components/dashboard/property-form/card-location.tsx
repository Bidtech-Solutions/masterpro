"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  KEPRI_PROVINCE_CONFIG,
  getCityById,
  getDefaultDistrictForCity,
} from "@/config/locations";

interface CardLocationProps {
  provinceId: number;
  setProvinceId: (id: number) => void;
  cityId: number;
  setCityId: (id: number) => void;
  district: string;
  setDistrict: (district: string) => void;
  postalCode: string;
  setPostalCode: (code: string) => void;
  address: string;
  setAddress: (address: string) => void;
  latitude: number | null;
  longitude: number | null;
  setCoordinates: (lat: number, lng: number) => void;
}

export function CardLocation({
  provinceId,
  setProvinceId,
  cityId,
  setCityId,
  district,
  setDistrict,
  postalCode,
  setPostalCode,
  address,
  setAddress,
  latitude,
  longitude,
  setCoordinates,
}: CardLocationProps) {
  const t = useTranslations("dashboard");

  const currentCity = getCityById(cityId);
  const districtOptions = currentCity.districts;

  const handleCityChange = (newCityId: number) => {
    setCityId(newCityId);
    const newCity = getCityById(newCityId);
    if (newCity) {
      const defaultDist = getDefaultDistrictForCity(newCityId);
      setDistrict(defaultDist);
      if (!postalCode) {
        setPostalCode(newCity.defaultPostalCode);
      }
      setCoordinates(newCity.defaultCoordinates.lat, newCity.defaultCoordinates.lng);
    }
  };

  const currentLat = latitude ?? currentCity.defaultCoordinates.lat;
  const currentLng = longitude ?? currentCity.defaultCoordinates.lng;
  const coordsText = `${currentLat.toFixed(4)}° N, ${currentLng.toFixed(4)}° E`;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-[#EBF5FF] text-[#2563EB]">
          <MapPin className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("cardLocationTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("cardLocationSubtitle")}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Row 1: Provinsi & Kota / Kabupaten */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("province")} *</label>
            <select
              value={provinceId}
              onChange={(e) => setProvinceId(parseInt(e.target.value, 10))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
            >
              <option value={KEPRI_PROVINCE_CONFIG.id}>{KEPRI_PROVINCE_CONFIG.name}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">{t("cityDistrict")} *</label>
            <select
              value={cityId}
              onChange={(e) => handleCityChange(parseInt(e.target.value, 10))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
            >
              {KEPRI_PROVINCE_CONFIG.cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Kecamatan & Kode Pos */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("district")} *</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden"
            >
              {districtOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">{t("postalCode")}</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder={currentCity.defaultPostalCode}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Row 3: Alamat Lengkap / Nama Klaster */}
        <div>
          <label className="block text-xs font-bold text-slate-700">{t("fullAddress")} *</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={currentCity.addressPlaceholder}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden"
          />
        </div>

        {/* Row 4: Box Titik Koordinat Presisi */}
        <div className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-[#F0F7FF]/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
              <MapPin className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {t("mapCoordinates", { coords: coordsText })}
              </p>
              <p className="text-[11px] text-slate-500">{t("mapCoordinatesHint")}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setCoordinates(currentCity.defaultCoordinates.lat, currentCity.defaultCoordinates.lng)
            }
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-700 shadow-2xs transition-colors hover:bg-sky-50 sm:self-auto"
          >
            <MapPin className="size-3.5 text-sky-600" />
            <span>{t("pickMapPoint")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
