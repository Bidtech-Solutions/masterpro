/**
 * Cakupan wilayah MasterPro: khusus Kota Batam, Kepulauan Riau (PRD §4.1).
 * ID & slug mengikuti data referensi DB (migrasi 000002_seed_reference). Website hanya menampilkan
 * listing kota ini dan formulir dashboard mengunci provinsi/kota ke sini.
 */

export interface DistrictOption {
  value: string;
  label: string;
}

export const serviceProvince = {
  id: 21,
  name: "Kepulauan Riau",
  slug: "kepulauan-riau",
} as const;

export const serviceCity = {
  id: 2171,
  name: "Kota Batam",
  /** Label pendek untuk UI publik. */
  shortName: "Batam",
  slug: "kota-batam",
  /** Titik pusat kota — fallback peta bila listing belum punya koordinat. */
  center: { lat: 1.1201, lng: 104.053 },
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
  ] satisfies DistrictOption[],
} as const;

/** Kecamatan default formulir listing baru. */
export const defaultDistrict = "Batam Kota";

/** Kecamatan yang ditampilkan di kolom "Area Populer" footer (PRD WEB-G-02). */
export const popularDistricts = ["Batam Kota", "Lubuk Baja", "Batu Ampar", "Sekupang", "Nongsa"] as const;
