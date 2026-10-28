/** Data referensi (docs/API.md §4.1). */
export interface PropertyTypeRef {
  id: number;
  slug: string;
  name_id: string;
  name_en: string;
}

export interface PropertyType extends PropertyTypeRef {
  allow_sale: boolean;
  allow_rent: boolean;
  active_listing_count: number;
}

export interface Facility {
  id: number;
  slug: string;
  name_id: string;
  name_en: string;
  icon: string;
}

export interface Province {
  id: number;
  slug: string;
  name: string;
}

export interface City {
  id: number;
  slug: string;
  name: string;
  kind: "kota" | "kabupaten";
  province: Province;
  active_listing_count: number;
}
