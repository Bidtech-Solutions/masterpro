import { commissionSplit, rentCommissionTiers, saleCommissionTiers } from "@/config/commission";
import { site } from "@/config/site";
import { getPathname } from "@/i18n/navigation";
import { cacheTags, serverGet } from "@/lib/api/server";
import { formatPriceFull } from "@/lib/format";
import type { PropertyCard } from "@/types/property";

export const revalidate = 3600;

const MAX_PAGES = 42; // 42 × 48 ≈ 2.000 listing terbaru (PRD §9.5)

/** llms-full.txt — profil, program agen, dan daftar listing aktif dalam Markdown (PRD §9.5). */
export async function GET() {
  const listings: PropertyCard[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await serverGet<PropertyCard[]>("/public/properties", {
      revalidate: 3600,
      tags: [cacheTags.propertiesList],
      query: { sort: "newest", per_page: 48, page },
    }).catch(() => null);
    if (!res) break;
    listings.push(...res.data);
    if (!res.meta || page >= res.meta.total_pages) break;
  }

  const lines = [
    `# ${site.name}`,
    "",
    "MasterPro menaungi jaringan agen properti untuk jual (primary & secondary) dan sewa: rumah, apartemen, ruko, gedung kos, dan tanah.",
    `Hubungi agen langsung lewat tombol WhatsApp di setiap listing, atau admin di ${site.contact.whatsappDisplay} / ${site.contact.email}.`,
    "",
    "## Program agen & komisi",
    "",
    `- Komisi penjualan: ${saleCommissionTiers.map((t) => `${t.percent}%`).join(" / ")} (di bawah Rp 1 M / Rp 1–3 M / di atas Rp 3 M)`,
    `- Komisi penyewaan: ${rentCommissionTiers.map((t) => `${t.percent}%`).join(" / ")} (di bawah Rp 25 jt / Rp 25–50 jt / di atas Rp 50 jt)`,
    `- Pembagian: ${commissionSplit.map((s) => `${s.key} ${s.percent}%`).join(", ")}`,
    "",
    `## Listing aktif (${listings.length})`,
    "",
    ...listings.map((p) => {
      const url = new URL(
        getPathname({ href: { pathname: "/properties/[slug]", params: { slug: p.slug } }, locale: "id" }),
        site.url,
      );
      const where = [p.location.district, p.location.city.name, p.location.province.name]
        .filter(Boolean)
        .join(", ");
      const kind = `${p.listing_type === "sale" ? "Dijual" : "Disewa"} · ${p.property_type.name_id}`;
      return `- [${p.title}](${url}) — ${kind} · ${formatPriceFull(p.price, "id")} · ${where} · Kode ${p.code}`;
    }),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
