/**
 * Konfigurasi wilayah provinsi Kepulauan Riau (PRD §12 & §18, database seed 000002_seed_reference).
 * Menyediakan pemetaan resmi kota, kabupaten, kecamatan, kode pos default, dan titik koordinat sentral.
 */

export interface DistrictOption {
  value: string;
  label: string;
  postalCode?: string;
}

export interface CityLocationConfig {
  id: number;
  code: string;
  name: string;
  slug: string;
  kind: "kota" | "kabupaten";
  defaultCoordinates: {
    lat: number;
    lng: number;
  };
  defaultPostalCode: string;
  addressPlaceholder: string;
  districts: DistrictOption[];
}

export interface ProvinceLocationConfig {
  id: number;
  name: string;
  slug: string;
  cities: CityLocationConfig[];
}

export const KEPRI_PROVINCE_CONFIG: ProvinceLocationConfig = {
  id: 21,
  name: "Kepulauan Riau",
  slug: "kepulauan-riau",
  cities: [
    {
      id: 2171,
      code: "21.71",
      name: "Kota Batam",
      slug: "kota-batam",
      kind: "kota",
      defaultCoordinates: { lat: 1.1201, lng: 104.053 },
      defaultPostalCode: "29461",
      addressPlaceholder: "Contoh: Perumahan Dutamas Blok D No. 18, Batam Centre",
      districts: [
        { value: "Batam Kota", label: "Batam Kota (Batam Centre, Sukajadi)" },
        { value: "Lubuk Baja", label: "Lubuk Baja (Nagoya, Windsor)" },
        { value: "Batu Ampar", label: "Batu Ampar (Harbour Bay, Jodoh)" },
        { value: "Bengkong", label: "Bengkong (Golden Prawn, Harapan Indah)" },
        { value: "Sekupang", label: "Sekupang (Tibang, Tanjung Pinggir)" },
        { value: "Nongsa", label: "Nongsa (Kabil, Resort, Bandara Hang Nadim)" },
        { value: "Batu Aji", label: "Batu Aji (Mitra Raya 2, Tanjung Uncang)" },
        { value: "Sagulung", label: "Sagulung (Tunas Regency, Tembesi)" },
        { value: "Sei Beduk", label: "Sei Beduk (Muka Kuning, Panbil)" },
        { value: "Belakang Padang", label: "Belakang Padang (Pulau Sambu)" },
        { value: "Bulang", label: "Bulang (Pulau Buluh)" },
        { value: "Galang", label: "Galang (Rempang, Sembulang)" },
      ],
    },
    {
      id: 2172,
      code: "21.72",
      name: "Kota Tanjungpinang",
      slug: "kota-tanjung-pinang",
      kind: "kota",
      defaultCoordinates: { lat: 0.9168, lng: 104.4578 },
      defaultPostalCode: "29124",
      addressPlaceholder: "Contoh: Komplek Bintan Center Blok B No. 12, Tanjungpinang Timur",
      districts: [
        { value: "Tanjungpinang Timur", label: "Tanjungpinang Timur (Bintan Center, Km 9-11)" },
        { value: "Tanjungpinang Barat", label: "Tanjungpinang Barat (Tepi Laut, Pusat Kota)" },
        { value: "Tanjungpinang Kota", label: "Tanjungpinang Kota (Senggarang, Sri Bintan Pura)" },
        { value: "Bukit Bestari", label: "Bukit Bestari (Dompak, Pusat Pemerintahan Kepri)" },
      ],
    },
    {
      id: 2101,
      code: "21.01",
      name: "Kabupaten Bintan",
      slug: "kabupaten-bintan",
      kind: "kabupaten",
      defaultCoordinates: { lat: 1.0345, lng: 104.4442 },
      defaultPostalCode: "29151",
      addressPlaceholder: "Contoh: Kawasan Wisata Lagoi, Jl. Wisata Bahari",
      districts: [
        { value: "Bintan Timur", label: "Bintan Timur (Kijang)" },
        { value: "Bintan Utara", label: "Bintan Utara (Tanjung Uban)" },
        { value: "Seri Kuala Lobam", label: "Seri Kuala Lobam (Kawasan Industri Lobam)" },
        { value: "Teluk Sebong", label: "Teluk Sebong (Kawasan Wisata Lagoi)" },
        { value: "Gunung Kijang", label: "Gunung Kijang (Pantai Trikora)" },
        { value: "Toapaya", label: "Toapaya" },
        { value: "Teluk Bintan", label: "Teluk Bintan (Bandar Seri Bentan)" },
        { value: "Mantang", label: "Mantang" },
        { value: "Bintan Pesisir", label: "Bintan Pesisir" },
        { value: "Tambelan", label: "Tambelan" },
      ],
    },
    {
      id: 2102,
      code: "21.02",
      name: "Kabupaten Karimun",
      slug: "kabupaten-karimun",
      kind: "kabupaten",
      defaultCoordinates: { lat: 0.9931, lng: 103.4285 },
      defaultPostalCode: "29661",
      addressPlaceholder: "Contoh: Jl. Jenderal Sudirman No. 45, Meral, Tanjung Balai Karimun",
      districts: [
        { value: "Karimun", label: "Karimun (Tanjung Balai Karimun)" },
        { value: "Meral", label: "Meral" },
        { value: "Meral Barat", label: "Meral Barat" },
        { value: "Tebing", label: "Tebing" },
        { value: "Kundur", label: "Kundur (Tanjung Batu)" },
        { value: "Kundur Barat", label: "Kundur Barat" },
        { value: "Kundur Utara", label: "Kundur Utara" },
        { value: "Moro", label: "Moro" },
        { value: "Durai", label: "Durai" },
        { value: "Buru", label: "Buru" },
        { value: "Belat", label: "Belat" },
        { value: "Ungar", label: "Ungar" },
      ],
    },
    {
      id: 2103,
      code: "21.03",
      name: "Kabupaten Natuna",
      slug: "kabupaten-natuna",
      kind: "kabupaten",
      defaultCoordinates: { lat: 3.9456, lng: 108.1428 },
      defaultPostalCode: "29783",
      addressPlaceholder: "Contoh: Jl. Soekarno-Hatta, Ranai Kota, Bunguran Timur",
      districts: [
        { value: "Bunguran Timur", label: "Bunguran Timur (Ranai Kota)" },
        { value: "Bunguran Timur Laut", label: "Bunguran Timur Laut" },
        { value: "Bunguran Tengah", label: "Bunguran Tengah" },
        { value: "Bunguran Selatan", label: "Bunguran Selatan" },
        { value: "Bunguran Barat", label: "Bunguran Barat (Sedanau)" },
        { value: "Bunguran Utara", label: "Bunguran Utara" },
        { value: "Bunguran Batubi", label: "Bunguran Batubi" },
        { value: "Pulau Tiga", label: "Pulau Tiga" },
        { value: "Pulau Tiga Barat", label: "Pulau Tiga Barat" },
        { value: "Midai", label: "Midai" },
        { value: "Suak Midai", label: "Suak Midai" },
        { value: "Serasan", label: "Serasan" },
        { value: "Serasan Timur", label: "Serasan Timur" },
        { value: "Subi", label: "Subi" },
        { value: "Pulau Laut", label: "Pulau Laut" },
      ],
    },
    {
      id: 2104,
      code: "21.04",
      name: "Kabupaten Lingga",
      slug: "kabupaten-lingga",
      kind: "kabupaten",
      defaultCoordinates: { lat: -0.2173, lng: 104.6145 },
      defaultPostalCode: "29872",
      addressPlaceholder: "Contoh: Jl. Merdeka, Dabo Singkep",
      districts: [
        { value: "Singkep", label: "Singkep (Dabo Singkep)" },
        { value: "Singkep Barat", label: "Singkep Barat" },
        { value: "Singkep Pesisir", label: "Singkep Pesisir" },
        { value: "Singkep Selatan", label: "Singkep Selatan" },
        { value: "Lingga", label: "Lingga (Daik Lingga)" },
        { value: "Lingga Utara", label: "Lingga Utara" },
        { value: "Lingga Timur", label: "Lingga Timur" },
        { value: "Senayang", label: "Senayang" },
        { value: "Selayar", label: "Selayar" },
        { value: "Bakung Serumpun", label: "Bakung Serumpun" },
        { value: "Temiang Pesisir", label: "Temiang Pesisir" },
        { value: "Kepulauan Posek", label: "Kepulauan Posek" },
        { value: "Katang Bidare", label: "Katang Bidare" },
      ],
    },
    {
      id: 2105,
      code: "21.05",
      name: "Kabupaten Kepulauan Anambas",
      slug: "kabupaten-kepulauan-anambas",
      kind: "kabupaten",
      defaultCoordinates: { lat: 3.2166, lng: 106.2166 },
      defaultPostalCode: "29791",
      addressPlaceholder: "Contoh: Jl. Hang Tuah, Tarempa, Siantan",
      districts: [
        { value: "Siantan", label: "Siantan (Tarempa)" },
        { value: "Siantan Selatan", label: "Siantan Selatan" },
        { value: "Siantan Timur", label: "Siantan Timur" },
        { value: "Siantan Tengah", label: "Siantan Tengah" },
        { value: "Siantan Utara", label: "Siantan Utara" },
        { value: "Palmatak", label: "Palmatak" },
        { value: "Jemaja", label: "Jemaja (Letung)" },
        { value: "Jemaja Timur", label: "Jemaja Timur" },
        { value: "Jemaja Barat", label: "Jemaja Barat" },
        { value: "Kute Siantan", label: "Kute Siantan" },
      ],
    },
  ],
};

export const DEFAULT_CITY_CONFIG = KEPRI_PROVINCE_CONFIG.cities[0]!;

/** Ambil konfigurasi kota berdasarkan ID kota (cth. 2171, 2172). */
export function getCityById(cityId: number): CityLocationConfig {
  return KEPRI_PROVINCE_CONFIG.cities.find((c) => c.id === cityId) ?? DEFAULT_CITY_CONFIG;
}

/** Ambil daftar kecamatan resmi untuk suatu ID kota. */
export function getDistrictsByCityId(cityId: number): DistrictOption[] {
  const city = getCityById(cityId);
  return city.districts;
}

/** Ambil nilai kecamatan default (pertama) untuk suatu ID kota. */
export function getDefaultDistrictForCity(cityId: number): string {
  const districts = getDistrictsByCityId(cityId);
  return districts[0]?.value ?? "";
}
