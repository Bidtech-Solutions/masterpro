import type { Province, PropertyTypeRef } from "./reference";

/** Enum properti (docs/API.md §4.8). */
export type ListingType = "sale" | "rent";
export type MarketType = "primary" | "secondary";
export type PropertyStatus = "draft" | "active" | "sold" | "rented" | "inactive";
export type RentPeriod = "monthly" | "yearly";
export type PublicSort = "newest" | "price_asc" | "price_desc" | "popular" | "land_area_desc";

export interface ImageMini {
  url: string;
  width: number;
  height: number;
}

/** PropertyCard (docs/API.md §4.3). */
export interface PropertyCard {
  id: string;
  code: string;
  slug: string;
  title: string;
  listing_type: ListingType;
  market_type: MarketType;
  property_type: PropertyTypeRef;
  price: number;
  rent_period: RentPeriod | null;
  is_price_negotiable: boolean;
  location: {
    district: string | null;
    city: { id: number; slug: string; name: string };
    province: Pick<Province, "id" | "slug" | "name">;
  };
  land_area: number | null;
  building_area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  total_rooms: number | null;
  cover_image: ImageMini | null;
  image_count: number;
  agent: { agent_code: string; name: string; whatsapp_number: string };
  published_at: string | null;
}

export interface PropertyDetailImage {
  id: string;
  url: string;
  width: number;
  height: number;
  sort_order: number;
  is_cover: boolean;
}

export interface PropertyDetailFacility {
  id: number;
  slug: string;
  name_id: string;
  name_en: string;
  icon: string;
}

export interface PropertyDetailAgent {
  agent_code: string;
  name: string;
  photo_url: string | null;
  whatsapp_number: string;
}

/** PropertyDetail (docs/API.md §4.4). */
export interface PropertyDetail extends Omit<PropertyCard, "agent"> {
  description: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  maid_bedrooms: number | null;
  floors: number | null;
  floor_level: number | null;
  carports: number | null;
  garages: number | null;
  electricity_va: number | null;
  water_source: string | null;
  certificate: string | null;
  furnishing: string | null;
  facing: string | null;
  year_built: number | null;
  video_url: string | null;
  facilities: PropertyDetailFacility[];
  images: PropertyDetailImage[];
  agent: PropertyDetailAgent;
  updated_at: string;
}

/** Query GET /public/properties (docs/API.md §7.1). */
export interface PublicPropertyQuery {
  q?: string;
  listing_type?: ListingType;
  market_type?: MarketType;
  property_type?: string;
  province?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  min_land_area?: number;
  max_land_area?: number;
  min_building_area?: number;
  max_building_area?: number;
  bedrooms?: number;
  bathrooms?: number;
  certificate?: string;
  furnishing?: string;
  sort?: PublicSort;
  page?: number;
  per_page?: number;
}

/** DashboardProperty (docs/API.md §4.5). */
export interface DashboardProperty {
  id: string;
  code: string;
  slug: string;
  title: string;
  listing_type: ListingType;
  market_type: MarketType;
  property_type: PropertyTypeRef;
  price: number;
  rent_period: RentPeriod | null;
  is_price_negotiable: boolean;
  status: PropertyStatus;
  location: {
    district: string | null;
    city: { id: number; slug: string; name: string };
    province: Pick<Province, "id" | "slug" | "name">;
  };
  land_area: number | null;
  building_area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  cover_image: ImageMini | null;
  image_count: number;
  agent: {
    id: string;
    agent_code: string;
    name: string;
    whatsapp_number: string;
    photo_url?: string | null;
    status?: "active" | "inactive";
  };
  view_count: number;
  whatsapp_click_count: number;
  is_featured: boolean;
  public_url: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}
