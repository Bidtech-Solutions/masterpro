import type { Locale } from "@/i18n/routing";
import type { PropertyCard } from "@/types/property";

import { formatPriceFull } from "./format";

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

/** Pesan template ke agen untuk satu listing (PRD §7.6). */
export function propertyInquiryMessage(p: PropertyCard, detailUrl: string, locale: Locale): string {
  const price = formatPriceFull(p.price, locale);
  const city = p.location.city.name;
  return locale === "id"
    ? `Halo ${p.agent.name}, saya tertarik dengan properti "${p.title}" (Kode: ${p.code}) seharga ${price} di ${city}. Apakah masih tersedia? ${detailUrl}`
    : `Hi ${p.agent.name}, I'm interested in the property "${p.title}" (Code: ${p.code}) priced at ${price} in ${city}. Is it still available? ${detailUrl}`;
}
