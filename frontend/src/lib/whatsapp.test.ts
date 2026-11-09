import { describe, expect, it } from "vitest";

import type { PropertyCard } from "@/types/property";

import {
  normalizeWhatsapp,
  propertyInquiryMessage,
  propertyShareDescription,
  propertyShareMessage,
  type ShareableProperty,
  whatsappShareUrl,
  whatsappUrl,
} from "./whatsapp";

const property = {
  title: "Rumah Minimalis",
  code: "MP-000123",
  price: 1_250_000_000,
  location: { city: { name: "Kota Batam" } },
  agent: { name: "Budi", whatsapp_number: "6281234567890" },
} as unknown as PropertyCard;

describe("whatsapp (PRD §7.6)", () => {
  it("menormalkan nomor", () => {
    expect(normalizeWhatsapp("0812-3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("6281234567890")).toBe("6281234567890");
  });

  it("membentuk pesan template & URL wa.me", () => {
    const msg = propertyInquiryMessage(property, "https://masterpro.co.id/id/properti/x", "id");
    expect(msg).toBe(
      'Halo Budi, saya tertarik dengan properti "Rumah Minimalis" (Kode: MP-000123) seharga Rp 1.250.000.000 di Kota Batam. Apakah masih tersedia? https://masterpro.co.id/id/properti/x',
    );
    expect(whatsappUrl("081234567890", "Halo agen")).toBe("https://wa.me/6281234567890?text=Halo%20agen");
  });
});

describe("bagikan listing (PRD §7.6, WEB-D-09)", () => {
  const listing = {
    title: "Rumah Minimalis",
    price: 1_250_000_000,
    rent_period: null,
    location: { district: "Batam Kota", city: { name: "Kota Batam" } },
    land_area: 120,
    building_area: 140,
    bedrooms: 3,
    bathrooms: 2,
    agent: { name: "Budi", agent_code: "AG-001" },
  } as unknown as ShareableProperty;

  it("membentuk pesan WhatsApp lengkap", () => {
    expect(propertyShareMessage(listing, "https://masterpro.co.id/id/properti/x", "id")).toBe(
      [
        "*Rumah Minimalis*",
        "📍 Batam Kota, Kota Batam",
        "🏠 3 KT · 2 KM · LT 120 m² · LB 140 m²",
        "💰 Rp 1.250.000.000",
        "👤 Agen: Budi (AG-001)",
        "",
        "https://masterpro.co.id/id/properti/x",
      ].join("\n"),
    );
    expect(whatsappShareUrl("a b")).toBe("https://wa.me/?text=a%20b");
  });

  it("melewati spesifikasi kosong & menambah periode sewa", () => {
    const land = { ...listing, bedrooms: null, bathrooms: null, building_area: null, rent_period: "yearly" };
    expect(propertyShareMessage(land as ShareableProperty, "u", "en")).toBe(
      [
        "*Rumah Minimalis*",
        "📍 Batam Kota, Kota Batam",
        "🏠 Land 120 m²",
        "💰 IDR 1,250,000,000/year",
        "👤 Agent: Budi (AG-001)",
        "",
        "u",
      ].join("\n"),
    );
  });

  it("membentuk deskripsi meta satu baris", () => {
    expect(propertyShareDescription(listing, "id")).toBe(
      "Rumah Minimalis · Batam Kota, Kota Batam · 3 KT · 2 KM · LT 120 m² · LB 140 m² · Rp 1.250.000.000 · Agen: Budi",
    );
  });
});
