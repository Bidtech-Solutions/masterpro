import "server-only";

import type { ApiResponse, PaginationMeta } from "@/types/api";

/**
 * Klien API untuk Server Component / route handler (PRD §9.2, §10.2).
 * Memanggil backend lewat jaringan Docker internal (INTERNAL_API_URL) dengan cache ISR berlabel tag.
 */

export const cacheTags = {
  propertiesList: "properties:list",
  reference: "reference",
  property: (slug: string) => `property:${slug}`,
} as const;

type QueryValue = string | number | boolean | null | undefined;

export interface ServerGetOptions {
  /** Detik; default 60. */
  revalidate?: number;
  tags?: string[];
  query?: Record<string, QueryValue>;
}

export interface ServerResult<T> {
  data: T;
  meta?: PaginationMeta;
}

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

/**
 * GET ke /api/v1{path}.
 * - Saat `next build` (API tidak tersedia) → null; pipeline merevalidasi setelah deploy.
 * - 404 → null.
 * - Error lain → throw, agar ISR mempertahankan halaman terakhir yang berhasil.
 */
export async function serverGet<T>(
  path: string,
  opts: ServerGetOptions = {},
): Promise<ServerResult<T> | null> {
  if (isBuildPhase()) return null;
  const url = new URL(`/api/v1${path}`, process.env.INTERNAL_API_URL ?? "http://backend:8080");
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: opts.revalidate ?? 60, tags: opts.tags },
  });
  if (res.status === 404) return null;
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !body || !body.success) {
    throw new Error(`API ${path} gagal: ${res.status} ${body && !body.success ? body.error.code : ""}`);
  }
  return { data: body.data, meta: body.meta };
}
