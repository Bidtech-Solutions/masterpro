import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Host media dibaca saat build (NEXT_PUBLIC_MEDIA_URL di-inline). Lihat PRD §9.6.
const media = new URL(process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://media.localhost");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [96, 128, 256, 384],
    qualities: [60, 75, 85],
    minimumCacheTTL: 2678400, // 31 hari; object key media immutable
    // Host media di-resolve ke IP internal Docker (alias Traefik, PRD §10.1). Aman karena remotePatterns
    // hanya mengizinkan host media.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      { protocol: media.protocol.replace(":", "") as "http" | "https", hostname: media.hostname },
      { protocol: "http", hostname: "media.localhost" },
    ],
  },
};

export default withNextIntl(nextConfig);
