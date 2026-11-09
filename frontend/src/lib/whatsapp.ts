import type { Locale } from "@/i18n/routing";
import type { PropertyCard } from "@/types/property";

import { formatArea, formatPriceFull } from "./format";

/** Normalisasi nomor Indonesia ke format wa.me: 08xx / +62xx / 62xx → 62xx. */
export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${normalizeWhatsapp(number)}?text=${encodeURIComponent(message)}`;
}

/** URL bagikan ke WhatsApp tanpa nomor tujuan — pengguna memilih kontak sendiri (PRD WEB-D-09). */
export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Pesan template ke agen untuk satu listing (PRD §7.6). */
export function propertyInquiryMessage(p: PropertyCard, detailUrl: string, locale: Locale): string {
  const price = formatPriceFull(p.price, locale);
  const city = p.location.city.name;
  return locale === "id"
    ? `Halo ${p.agent.name}, saya tertarik dengan properti "${p.title}" (Kode: ${p.code}) seharga ${price} di ${city}. Apakah masih tersedia? ${detailUrl}`
    : `Hi ${p.agent.name}, I'm interested in the property "${p.title}" (Code: ${p.code}) priced at ${price} in ${city}. Is it still available? ${detailUrl}`;
}

/** Data minimum untuk ringkasan bagikan (cocok untuk PropertyCard maupun PropertyDetail). */
export type ShareableProperty = Pick<
  PropertyCard,
  "title" | "price" | "rent_period" | "location" | "land_area" | "building_area" | "bedrooms" | "bathrooms"
> & { agent: { name: string; agent_code: string } };

const shareLabels = {
  id: {
    bed: "KT",
    bath: "KM",
    land: "LT",
    building: "LB",
    agent: "Agen",
    monthly: "/bulan",
    yearly: "/tahun",
  },
  en: {
    bed: "Bed",
    bath: "Bath",
    land: "Land",
    building: "Building",
    agent: "Agent",
    monthly: "/month",
    yearly: "/year",
  },
} as const;

/** Spesifikasi ringkas: "3 KT · 2 KM · LT 120 m² · LB 140 m²" — field kosong dilewati. */
export function propertySpecSummary(p: ShareableProperty, locale: Locale): string {
  const l = shareLabels[locale];
  return [
    p.bedrooms ? `${p.bedrooms} ${l.bed}` : null,
    p.bathrooms ? `${p.bathrooms} ${l.bath}` : null,
    p.land_area ? `${l.land} ${formatArea(p.land_area, locale)}` : null,
    p.building_area ? `${l.building} ${formatArea(p.building_area, locale)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function priceWithPeriod(p: ShareableProperty, locale: Locale): string {
  const l = shareLabels[locale];
  const period = p.rent_period === "monthly" ? l.monthly : p.rent_period === "yearly" ? l.yearly : "";
  return `${formatPriceFull(p.price, locale)}${period}`;
}

function placeOf(p: ShareableProperty): string {
  return [p.location.district, p.location.city.name].filter(Boolean).join(", ");
}

/** Pesan "Bagikan listing" ke WhatsApp (PRD §7.6): judul, lokasi, spesifikasi, harga, agen, tautan. */
export function propertyShareMessage(p: ShareableProperty, detailUrl: string, locale: Locale): string {
  const specs = propertySpecSummary(p, locale);
  return [
    `*${p.title}*`,
    `📍 ${placeOf(p)}`,
    specs ? `🏠 ${specs}` : null,
    `💰 ${priceWithPeriod(p, locale)}`,
    `👤 ${shareLabels[locale].agent}: ${p.agent.name} (${p.agent.agent_code})`,
    "",
    detailUrl,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Ringkasan satu baris untuk meta description / og:description (PRD WEB-D-09). */
export function propertyShareDescription(p: ShareableProperty, locale: Locale): string {
  const specs = propertySpecSummary(p, locale);
  return [
    p.title,
    placeOf(p),
    specs || null,
    priceWithPeriod(p, locale),
    `${shareLabels[locale].agent}: ${p.agent.name}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
