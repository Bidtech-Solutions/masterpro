/**
 * Identitas & kontak perusahaan (PRD WEB-G-03).
 * [KONFIRMASI KLIEN] Semua nilai kontak di bawah masih contoh dari desain Stitch — ganti dengan data resmi.
 */
export const site = {
  name: "MasterPro Real Estate",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost",
  mediaUrl: process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://media.localhost",
  logo: "/brand/logo.png",
  logoWhite: "/brand/logo-white.png",
  ogImage: "/brand/og-default.jpg",
  contact: {
    address: "Jl. Raja H. Fisabilillah No. 88, Batam Centre, Kota Batam, Kepulauan Riau 29461",
    mapsUrl: "https://maps.google.com/?q=Batam+Centre",
    phone: "(0778) 456-7890",
    phoneHref: "tel:+627784567890",
    /** Nomor WhatsApp admin, format 62… tanpa "+" (PRD §7.6). */
    whatsappAdmin: "628117788990",
    whatsappDisplay: "+62 811-7788-990",
    email: "info@masterpro.co.id",
  },
  social: [
    { name: "Instagram", href: "https://instagram.com/" },
    { name: "Facebook", href: "https://facebook.com/" },
    { name: "LinkedIn", href: "https://linkedin.com/" },
    { name: "YouTube", href: "https://youtube.com/" },
  ],
  popularCities: [
    { name: "Kota Batam", slug: "kota-batam" },
    { name: "Jakarta Selatan", slug: "kota-administrasi-jakarta-selatan" },
    { name: "Tangerang Selatan", slug: "kota-tangerang-selatan" },
    { name: "Bandung", slug: "kota-bandung" },
    { name: "Surabaya", slug: "kota-surabaya" },
  ],
} as const;
