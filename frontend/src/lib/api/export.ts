"use client";

export interface PropertyExportParams {
  q?: string;
  status?: string;
  listing_type?: string;
  market_type?: string;
  property_type?: string;
  city?: string;
  agent_id?: string;
  min_price?: number;
  max_price?: number;
  created_from?: string;
  created_to?: string;
  sort?: string;
}

/**
 * Mengunduh laporan Excel data properti resmi (API.md §12.10 & PRD §6.6).
 * Menggunakan fetch -> blob agar pesan error JSON dari server dapat ditangkap.
 */
export async function downloadPropertiesExcel(params: PropertyExportParams = {}): Promise<void> {
  const url = new URL("/api/v1/properties/export", window.location.origin);

  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "" && val !== "all") {
      url.searchParams.set(key, String(val));
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const errorMsg =
      errorJson?.error?.message ||
      (response.status === 422
        ? "Jumlah baris melebihi batas 10.000 atau filter tidak valid"
        : `Gagal mengunduh laporan (${response.status})`);
    throw new Error(errorMsg);
  }

  // Ambil nama file dari header Content-Disposition bila tersedia
  let filename = "masterpro-properti.xlsx";
  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const matches = disposition.match(/filename="?([^";]+)"?/);
    if (matches && matches[1]) {
      filename = matches[1];
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
