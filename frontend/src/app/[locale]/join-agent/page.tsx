import { notFound } from "next/navigation";

/**
 * Halaman Daftar Agen — DISEMBUNYIKAN (PRD §5.5): route selalu 404 dan tidak ditautkan dari
 * header, footer, sitemap, maupun llms.txt. Komponen `components/join-agent/*` tetap disimpan;
 * untuk mengaktifkan kembali, render AgentHero, AgentBenefits, AgentCommission, AgentFaq, dan
 * PopularBanner di sini serta kembalikan tautan menu/sitemap.
 */
export default function JoinAgentPage() {
  notFound();
}
