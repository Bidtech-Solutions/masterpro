import type { MetadataRoute } from "next";

import { site } from "@/config/site";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppPathname } from "@/i18n/routing";
import { cacheTags, serverGet } from "@/lib/api/server";

export const revalidate = 3600;

const staticPages: Exclude<AppPathname, "/properties/[slug]">[] = ["/", "/properties", "/join-agent"];

type Href = Parameters<typeof getPathname>[0]["href"];

function entry(href: Href, lastModified?: string): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales)
    languages[l] = new URL(getPathname({ href, locale: l }), site.url).toString();
  return {
    url: new URL(getPathname({ href, locale: routing.defaultLocale }), site.url).toString(),
    lastModified,
    alternates: { languages },
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
