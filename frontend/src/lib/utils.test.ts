import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("mempertahankan ukuran font kustom bersama warna teks", () => {
    expect(cn("text-h2 text-navy-900", "md:text-h1")).toBe("text-h2 text-navy-900 md:text-h1");
    expect(cn("text-body", "text-caption")).toBe("text-caption");
  });
});
