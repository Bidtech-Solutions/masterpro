import { describe, expect, it, vi } from "vitest";

import en from "../../messages/en.json";
import id from "../../messages/id.json";
import { alternateLanguages, buildMetadata, faqJsonLd } from "./seo";

// next-intl/navigation butuh runtime Next; cukup path berprefiks locale untuk menguji metadata.
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href, locale }: { href: string | { pathname: string }; locale: string }) =>
    `/${locale}${typeof href === "string" ? href : href.pathname}`,
}));

const locales = { id, en } as const;

describe("pesan SEO", () => {
  it.each(Object.entries(locales))("title 50–60 & deskripsi 120–160 karakter (%s)", (_, m) => {
    expect(m.seo.defaultTitle.length).toBeGreaterThanOrEqual(50);
    expect(m.seo.defaultTitle.length).toBeLessThanOrEqual(60);
    for (const d of [m.seo.defaultDescription, m.seo.propertiesDescription, m.seo.joinAgentDescription]) {
      expect(d.length).toBeGreaterThanOrEqual(120);
      expect(d.length).toBeLessThanOrEqual(160);
    }
  });

  it("kunci home.seoContent identik di id dan en", () => {
    expect(Object.keys(en.home.seoContent).sort()).toEqual(Object.keys(id.home.seoContent).sort());
  });
});

describe("buildMetadata", () => {
  it("tidak menulis kunci title bila kosong (agar default layout tidak tertimpa)", () => {
    const meta = buildMetadata({ locale: "id", href: "/", description: "x" });
    expect("title" in meta).toBe(false);
  });

  it("title absolute dipakai apa adanya & untuk Open Graph", () => {
    const meta = buildMetadata({ locale: "id", href: "/", title: { absolute: "Judul" }, description: "x" });
    expect(meta.title).toEqual({ absolute: "Judul" });
    expect(meta.openGraph?.title).toBe("Judul");
  });
});

describe("alternateLanguages", () => {
  it("memuat id-ID, en-US, dan x-default ke versi /id", () => {
    const l = alternateLanguages("/");
    expect(Object.keys(l).sort()).toEqual(["en-US", "id-ID", "x-default"]);
    expect(l["x-default"]).toBe(l["id-ID"]);
  });
});

describe("faqJsonLd", () => {
  it("membentuk FAQPage", () => {
    const ld = faqJsonLd([{ question: "Q", answer: "A" }]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity[0]?.acceptedAnswer.text).toBe("A");
  });
});
