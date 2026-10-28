import { timingSafeEqual } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

/**
 * Revalidasi cache ISR on-demand (PRD §10.4). Dipanggil backend & pipeline deploy lewat jaringan Docker.
 * Path /internal/* diblokir dari publik oleh Traefik (docker-compose.prod.yml).
 */
const bodySchema = z
  .object({
    tags: z.array(z.string().min(1).max(200)).max(100).default([]),
    /** true → seluruh halaman (dipakai pipeline setelah deploy, karena halaman hasil build belum punya tag). */
    all: z.boolean().default(false),
  })
  .refine((b) => b.all || b.tags.length > 0, { message: "tags atau all wajib diisi" });

function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET ?? "";
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return Response.json(
      { success: false, error: { code: "FORBIDDEN", message: "Secret tidak valid" } },
      { status: 403 },
    );
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Body tidak valid" } },
      { status: 422 },
    );
  }
  const { tags, all } = parsed.data;
  for (const tag of tags) {
    // expire: 0 → kedaluwarsa segera; request berikutnya meregenerasi halaman.
    revalidateTag(tag, { expire: 0 });
  }
  if (all) revalidatePath("/", "layout");
  return Response.json({ success: true, data: { tags, all } });
}
