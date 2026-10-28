import { site } from "@/config/site";
import { getPathname } from "@/i18n/navigation";

export const revalidate = 3600;

/** llms.txt (llmstxt.org) — ringkasan situs untuk LLM (PRD §9.5). */
export function GET() {
  const url = (href: Parameters<typeof getPathname>[0]["href"], locale: "id" | "en" = "id") =>
    new URL(getPathname({ href, locale }), site.url).toString();
  const body = `# ${site.name}

> MasterPro Real Estate adalah perusahaan yang menaungi jaringan agen properti untuk penjualan properti primary (baru) dan secondary (bekas) — rumah, apartemen, ruko, gedung kos, dan tanah — serta penyewaan rumah, ruko, dan apartemen di Indonesia.

## Halaman utama

- [Beranda](${url("/")}): pencarian properti berdasarkan lokasi, tipe, dan harga
- [Katalog properti](${url("/properties")}): daftar properti dijual & disewa dengan filter
- [Daftar agen](${url("/join-agent")}): program kemitraan agen, struktur komisi, dan kontak admin
- [English version](${url("/", "en")})

## Detail lengkap

- [llms-full.txt](${new URL("/llms-full.txt", site.url)}): profil perusahaan dan daftar listing aktif

## Kontak

- Email: ${site.contact.email}
- WhatsApp admin: ${site.contact.whatsappDisplay}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
