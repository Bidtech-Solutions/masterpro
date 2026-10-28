import type { AppPathname } from "@/i18n/routing";

/** Menu header (PRD WEB-G-01). `label` = kunci di messages namespace "nav". */
export const headerNav = [
  { href: "/", label: "home" },
  { href: "/properties", label: "properties" },
  { href: "/join-agent", label: "joinAgent" },
] as const satisfies ReadonlyArray<{ href: AppPathname; label: string }>;

/** Tautan kolom "Tipe Properti" footer (PRD WEB-G-02). `label` = kunci namespace "footer". */
export const footerPropertyLinks = [
  { label: "houseForSale", query: { listing: "sale", type: "rumah" } },
  { label: "apartmentForRent", query: { listing: "rent", type: "apartemen" } },
  { label: "shophouse", query: { type: "ruko" } },
  { label: "boardingHouse", query: { type: "kos" } },
  { label: "land", query: { type: "tanah" } },
  { label: "newDevelopment", query: { market: "primary" } },
] as const;

/** Menu sidebar dashboard (DESIGN.md §6.8). */
export const dashboardNav = [
  { href: "/dashboard", label: "overview", roles: ["admin", "agent"] },
  { href: "/dashboard/properties", label: "properties", roles: ["admin", "agent"] },
  { href: "/dashboard/agents", label: "agents", roles: ["admin"] },
  { href: "/dashboard/users", label: "users", roles: ["admin"] },
  { href: "/dashboard/account", label: "account", roles: ["admin", "agent"] },
] as const;
