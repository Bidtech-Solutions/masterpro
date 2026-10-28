import { describe, expect, it } from "vitest";

import { formatArea, formatPriceFull, formatPriceShort } from "./format";

describe("format harga & luas (PRD WEB-G-05)", () => {
  it("harga lengkap", () => {
    expect(formatPriceFull(1_250_000_000, "id")).toBe("Rp 1.250.000.000");
    expect(formatPriceFull(1_250_000_000, "en")).toBe("IDR 1,250,000,000");
  });

  it("harga ringkas", () => {
    expect(formatPriceShort(1_250_000_000, "id")).toBe("Rp 1,25 M");
    expect(formatPriceShort(850_000_000, "id")).toBe("Rp 850 jt");
    expect(formatPriceShort(7_500_000, "id")).toBe("Rp 7,5 jt");
    expect(formatPriceShort(1_250_000_000, "en")).toBe("IDR 1.25B");
    expect(formatPriceShort(850_000_000, "en")).toBe("IDR 850M");
  });

  it("luas", () => {
    expect(formatArea(120, "id")).toBe("120 m²");
    expect(formatArea(120.5, "id")).toBe("120,5 m²");
  });
});
