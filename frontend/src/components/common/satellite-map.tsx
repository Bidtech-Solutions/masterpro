"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

import { mapConfig } from "@/config/map";
import { roundCoordinate } from "@/lib/maps";
import { cn } from "@/lib/utils";

interface Props {
  latitude: number;
  longitude: number;
  zoom?: number;
  /** Diisi → peta bisa diklik & pin bisa digeser untuk memilih titik (PRP-03). */
  onPick?: (lat: number, lng: number) => void;
  /** Label aksesibel untuk peta & pin. */
  label: string;
  className?: string;
}

const PIN_HTML = `<div class="relative flex size-9 items-center justify-center">
  <span class="absolute inset-0 animate-ping rounded-full bg-blue-500/40"></span>
  <span class="relative flex size-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-xl">
    <span class="size-2.5 rounded-full bg-white"></span>
  </span>
</div>`;

/** Peta Leaflet berlapis citra satelit + label tempat (PRD WEB-D-08). */
export function SatelliteMap({
  latitude,
  longitude,
  zoom = mapConfig.detailZoom,
  onPick,
  label,
  className,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const initial = useRef({ latitude, longitude, zoom, label, pickable: Boolean(onPick) });
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Inisialisasi sekali; Leaflet butuh `window` sehingga dimuat dinamis di klien.
  useEffect(() => {
    let cancelled = false;
    const init = initial.current;

    void import("leaflet").then((L) => {
      if (cancelled || !container.current || mapRef.current) return;

      const map = L.map(container.current, {
        center: [init.latitude, init.longitude],
        zoom: init.zoom,
        maxZoom: mapConfig.maxZoom,
        scrollWheelZoom: false,
      });
      L.tileLayer(mapConfig.satelliteTiles.url, {
        maxZoom: mapConfig.maxZoom,
        attribution: mapConfig.satelliteTiles.attribution,
      }).addTo(map);
      L.tileLayer(mapConfig.labelTiles.url, { maxZoom: mapConfig.maxZoom }).addTo(map);

      const icon = L.divIcon({ className: "", html: PIN_HTML, iconSize: [36, 36], iconAnchor: [18, 18] });
      const marker = L.marker([init.latitude, init.longitude], {
        icon,
        title: init.label,
        alt: init.label,
        draggable: init.pickable,
        autoPan: true,
      }).addTo(map);

      if (init.pickable) {
        const pick = (lat: number, lng: number) =>
          onPickRef.current?.(roundCoordinate(lat), roundCoordinate(lng));
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          pick(p.lat, p.lng);
        });
        map.on("click", (e) => {
          marker.setLatLng(e.latlng);
          pick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Ikuti perubahan koordinat dari luar (input manual, tempel tautan, ganti listing).
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const current = marker.getLatLng();
    if (current.lat === latitude && current.lng === longitude) return;
    marker.setLatLng([latitude, longitude]);
    map.setView([latitude, longitude], Math.max(map.getZoom(), zoom));
  }, [latitude, longitude, zoom]);

  return (
    <div
      ref={container}
      role="region"
      aria-label={label}
      className={cn("isolate z-0 h-full w-full bg-slate-900", className)}
    />
  );
}
