import { defineRouting } from "next-intl/routing";

/** Routing bahasa website publik (PRD §5.0, §9.1). Dashboard tidak dilokalisasi. */
export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/properties": { id: "/properti", en: "/properties" },
    "/properties/[slug]": { id: "/properti/[slug]", en: "/properties/[slug]" },
    "/join-agent": { id: "/daftar-agen", en: "/join-as-agent" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
