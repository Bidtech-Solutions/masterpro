/**
 * Konfigurasi peta satelit (PRD WEB-D-08 & PRP-03).
 * Tile Esri World Imagery tidak memerlukan API key; atribusi wajib ditampilkan.
 */
export const mapConfig = {
  satelliteTiles: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics",
  },
  /** Lapisan label jalan & tempat di atas citra satelit. */
  labelTiles: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  },
  maxZoom: 19,
  /** Zoom halaman detail (titik listing). */
  detailZoom: 17,
  /** Zoom form dashboard sebelum titik dipilih (seluruh kota terlihat). */
  pickerZoom: 12,
  /** Presisi koordinat yang disimpan (~11 cm). */
  coordinateDecimals: 6,
} as const;
