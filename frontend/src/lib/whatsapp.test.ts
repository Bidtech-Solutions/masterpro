import { describe, expect, it } from "vitest";

import type { PropertyCard } from "@/types/property";

import { normalizeWhatsapp, propertyInquiryMessage, whatsappUrl } from "./whatsapp";

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
