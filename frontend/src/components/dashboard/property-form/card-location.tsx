"use client";

import { useState } from "react";
import { Link2, LocateFixed, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { SatelliteMap } from "@/components/common/satellite-map";
import { mapConfig } from "@/config/map";
import { serviceCity, serviceProvince } from "@/config/locations";
import { parseCoordinates, roundCoordinate } from "@/lib/maps";

interface CardLocationProps {
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

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden";
const lockedClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-600";

/** Kartu Lokasi form properti (PRD PRP-03): wilayah terkunci Kota Batam, titik dipilih di peta satelit. */
export function CardLocation({
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
  const [mapsLink, setMapsLink] = useState("");
  const [linkError, setLinkError] = useState(false);

  const hasPoint = latitude !== null && longitude !== null;
  const lat = latitude ?? serviceCity.center.lat;
  const lng = longitude ?? serviceCity.center.lng;

  function applyMapsLink(value: string) {
    setMapsLink(value);
    if (!value.trim()) {
      setLinkError(false);
      return;
    }
    const parsed = parseCoordinates(value);
    setLinkError(!parsed);
    if (parsed) setCoordinates(parsed.lat, parsed.lng);
  }

  function updateAxis(axis: "lat" | "lng", raw: string) {
    const value = Number(raw);
    if (raw === "" || !Number.isFinite(value)) return;
    const limit = axis === "lat" ? 90 : 180;
    if (Math.abs(value) > limit) return;
    if (axis === "lat") setCoordinates(roundCoordinate(value), lng);
    else setCoordinates(lat, roundCoordinate(value));
  }

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
        {/* Row 1: Provinsi & Kota (terkunci, PRD §4.1) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-xs font-bold text-slate-700">{t("province")} *</span>
            <p className={lockedClass}>{serviceProvince.name}</p>
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-700">{t("cityDistrict")} *</span>
            <p className={lockedClass}>{serviceCity.name}</p>
          </div>
        </div>
        <p className="-mt-2 text-[11px] text-slate-500">
          {t("serviceAreaLockedHint", { city: serviceCity.name })}
        </p>

        {/* Row 2: Kecamatan & Kode Pos */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="property-district" className="block text-xs font-bold text-slate-700">
              {t("district")} *
            </label>
            <select
              id="property-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={inputClass}
            >
              {serviceCity.districts.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="property-postal-code" className="block text-xs font-bold text-slate-700">
              {t("postalCode")}
            </label>
            <input
              id="property-postal-code"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder={serviceCity.defaultPostalCode}
              className={inputClass}
            />
          </div>
        </div>

        {/* Row 3: Alamat Lengkap / Nama Klaster */}
        <div>
          <label htmlFor="property-address" className="block text-xs font-bold text-slate-700">
            {t("fullAddress")} *
          </label>
          <input
            id="property-address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={serviceCity.addressPlaceholder}
            className={inputClass}
          />
        </div>

        {/* Row 4: Titik Koordinat — peta satelit, input manual, atau tempel tautan Google Maps */}
        <div className="space-y-3 rounded-xl border border-sky-100 bg-[#F0F7FF]/70 p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
              <LocateFixed className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{t("mapPickTitle")}</p>
              <p className="text-[11px] text-slate-500">{t("mapPickHint")}</p>
            </div>
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-slate-200 sm:aspect-[16/8]">
            <SatelliteMap
              latitude={lat}
              longitude={lng}
              zoom={hasPoint ? mapConfig.detailZoom : mapConfig.pickerZoom}
              onPick={setCoordinates}
              label={t("mapPickTitle")}
            />
            {!hasPoint && (
              <span className="pointer-events-none absolute top-2 left-2 z-[1000] rounded-md bg-amber-500 px-2 py-1 text-[11px] font-bold text-white shadow">
                {t("mapNotSet")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="property-lat" className="block text-[11px] font-bold text-slate-700">
                {t("latitude")}
              </label>
              <input
                id="property-lat"
                type="number"
                inputMode="decimal"
                step="any"
                value={latitude ?? ""}
                placeholder={String(serviceCity.center.lat)}
                onChange={(e) => updateAxis("lat", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="property-lng" className="block text-[11px] font-bold text-slate-700">
                {t("longitude")}
              </label>
              <input
                id="property-lng"
                type="number"
                inputMode="decimal"
                step="any"
                value={longitude ?? ""}
                placeholder={String(serviceCity.center.lng)}
                onChange={(e) => updateAxis("lng", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="property-maps-link" className="block text-[11px] font-bold text-slate-700">
              {t("mapsLinkLabel")}
            </label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute top-1/2 left-3 mt-[3px] size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                id="property-maps-link"
                type="text"
                value={mapsLink}
                onChange={(e) => applyMapsLink(e.target.value)}
                placeholder={t("mapsLinkPlaceholder")}
                aria-invalid={linkError}
                aria-describedby="property-maps-link-hint"
                className={`${inputClass} pl-8`}
              />
            </div>
            <p
              id="property-maps-link-hint"
              className={`mt-1 text-[11px] ${linkError ? "font-semibold text-red-600" : "text-slate-500"}`}
            >
              {linkError ? t("mapsLinkInvalid") : t("mapsLinkHint")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
