import type { MetadataRoute } from "next";

import { routing, type AppPathname } from "@/i18n/routing";
import { cacheTags, serverGet } from "@/lib/api/server";
import { absoluteUrl, alternateLanguages } from "@/lib/seo";

export const revalidate = 3600;

const staticPages: Exclude<AppPathname, "/properties/[slug]">[] = ["/", "/properties", "/join-agent"];

type Href = Parameters<typeof absoluteUrl>[0];

function entry(href: Href, lastModified?: string | Date): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(href, routing.defaultLocale),
    lastModified,
    alternates: { languages: alternateLanguages(href) },
  };
}

/** sitemap.xml: halaman statis + semua listing tayang (PRD §9.5). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // TODO(API.md §7.9): endpoint /public/sitemap/properties belum diimplementasi → daftar listing kosong.
  const listings = await serverGet<{ slug: string; updated_at: string }[]>("/public/sitemap/properties", {
    revalidate: 3600,
    tags: [cacheTags.propertiesList],
  }).catch(() => null);
  return [
    ...staticPages.map((p) => entry(p)),
    ...(listings?.data ?? []).map((l) =>
      entry({ pathname: "/properties/[slug]", params: { slug: l.slug } }, l.updated_at),
    ),
  ];
}
