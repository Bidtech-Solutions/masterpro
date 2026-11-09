import "server-only";

import { serviceCity } from "@/config/locations";
import { catalogPageSize, homeCarouselSize } from "@/config/search";
import type {
  ListingType,
  PropertyCard,
  PropertyDetail,
  PublicPropertyQuery,
  PublicSort,
} from "@/types/property";
import type { PropertyType } from "@/types/reference";

import { cacheTags, serverGet } from "./server";

/** Endpoint publik untuk Server Component. Lihat docs/API.md §7. */

export async function getLatestProperties(listing: ListingType) {
  const res = await serverGet<PropertyCard[]>("/public/properties", {
    revalidate: 0,
    tags: [cacheTags.propertiesList],
    query: { listing_type: listing, city: serviceCity.slug, sort: "newest", per_page: homeCarouselSize },
  });
  return res?.data ?? [];
}

export async function listPublicProperties(query: PublicPropertyQuery) {
  return serverGet<PropertyCard[]>("/public/properties", {
    revalidate: 0,
    tags: [cacheTags.propertiesList],
    query: { per_page: catalogPageSize, ...query },
  });
}

export async function getPropertyTypes() {
  const res = await serverGet<PropertyType[]>("/public/property-types", {
    revalidate: 300,
    tags: [cacheTags.reference, cacheTags.propertiesList],
  });
  return res?.data ?? [];
}

/** Detail properti (API.md §7.2). */
export async function getPublicProperty(slug: string) {
  const res = await serverGet<PropertyDetail>(`/public/properties/${encodeURIComponent(slug)}`, {
    revalidate: 0,
    tags: [cacheTags.property(slug), cacheTags.propertiesList],
  });
  return res?.data ?? null;
}

/** Properti serupa (API.md §7.3). */
export async function getSimilarProperties(slug: string, limit = 3) {
  const res = await serverGet<PropertyCard[]>(`/public/properties/${encodeURIComponent(slug)}/similar`, {
    revalidate: 0,
    tags: [cacheTags.property(slug), cacheTags.propertiesList],
    query: { limit },
  });
  return res?.data ?? [];
}

const sorts: PublicSort[] = ["newest", "price_asc", "price_desc", "popular", "land_area_desc"];

/** Kunci query URL website (PRD §5.0) → parameter API (API.md §1.1). */
export function webQueryToApi(sp: Record<string, string | string[] | undefined>): PublicPropertyQuery {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v >= 0 && one(k) !== undefined && one(k) !== "" ? v : undefined;
  };
  const listing = one("listing");
  const market = one("market");
  const sort = one("sort") as PublicSort | undefined;
  return {
    q: one("q"),
    listing_type: listing === "sale" || listing === "rent" ? listing : undefined,
    market_type: market === "primary" || market === "secondary" ? market : undefined,
    property_type: one("type"),
    // Cakupan wilayah khusus Kota Batam (PRD §4.1): province/city dari URL diabaikan.
    city: serviceCity.slug,
    min_price: num("min_price"),
    max_price: num("max_price"),
    min_land_area: num("min_land_area"),
    max_land_area: num("max_land_area"),
    min_building_area: num("min_building_area"),
    max_building_area: num("max_building_area"),
    bedrooms: num("bedrooms"),
    bathrooms: num("bathrooms"),
    certificate: one("certificate"),
    furnishing: one("furnishing"),
    sort: sort && sorts.includes(sort) ? sort : undefined,
    page: num("page"),
  };
}
