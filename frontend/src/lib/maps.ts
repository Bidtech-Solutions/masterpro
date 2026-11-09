import { mapConfig } from "@/config/map";

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Bulatkan koordinat ke presisi penyimpanan (PRP-03). */
export function roundCoordinate(value: number): number {
  const f = 10 ** mapConfig.coordinateDecimals;
  return Math.round(value * f) / f;
}

function valid(lat: number, lng: number): Coordinates | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat: roundCoordinate(lat), lng: roundCoordinate(lng) };
}

const NUM = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

/**
 * Ambil koordinat dari teks yang ditempel pengguna: pasangan "lat, lng" atau tautan Google Maps
 * (`@lat,lng`, `!3dlat!4dlng`, `?q=` / `query=` / `ll=` / `destination=`).
 * Tautan pendek (maps.app.goo.gl) tidak memuat koordinat sehingga mengembalikan null.
 */
export function parseCoordinates(input: string): Coordinates | null {
  let text = input.trim();
  if (!text) return null;
  try {
    text = decodeURIComponent(text);
  } catch {
    // biarkan apa adanya bila bukan teks ter-encode yang valid
  }

  const patterns = [
    new RegExp(String.raw`!3d${NUM}!4d${NUM}`), // titik pin yang tepat
    new RegExp(String.raw`[?&](?:q|query|ll|destination|center)=${NUM},\s*${NUM}`),
    new RegExp(String.raw`@${NUM},${NUM}`), // pusat tampilan peta
    new RegExp(String.raw`^${NUM}\s*[,;\s]\s*${NUM}$`), // "1.1234, 104.0567"
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return valid(Number(m[1]), Number(m[2]));
  }
  return null;
}

/** Tautan "Buka di Google Maps" untuk satu titik. */
export function googleMapsUrl({ lat, lng }: Coordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
