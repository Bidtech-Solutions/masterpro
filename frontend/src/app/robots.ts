import type { MetadataRoute } from "next";

import { site } from "@/config/site";

/** robots.txt (PRD §9.5). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/", "/internal/"] }],
    sitemap: new URL("/sitemap.xml", site.url).toString(),
    host: site.url,
  };
}
