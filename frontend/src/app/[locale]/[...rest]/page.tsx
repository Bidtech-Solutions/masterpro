import { notFound } from "next/navigation";

/** Menangkap path tak dikenal di bawah /[locale] agar not-found.tsx bilingual yang tampil. */
export default function CatchAllPage() {
  notFound();
}
