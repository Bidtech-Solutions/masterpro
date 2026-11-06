import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LoginForm } from "@/components/dashboard/login-form";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `Login Dashboard — ${site.name}`,
  robots: { index: false, follow: false },
};

/** Halaman login dashboard (AUTH-01, DESIGN.md §7.2) - Split layout dengan form di kanan. */
export default async function DashboardLoginPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="grid min-h-[100dvh] bg-white lg:grid-cols-2">
      {/* Panel Kiri: Identitas MasterPro (Desktop) - Elegan, Bersih, Matte, Non-Neon */}
      <aside className="relative hidden overflow-hidden bg-[#071833] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        {/* Garis Geometris Halus (Non-Neon, Non-Glow) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-96 rounded-full border-[32px] border-white/[0.04]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-20 size-80 rounded-full border border-white/[0.05]"
        />

        {/* Logo MasterPro */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src={site.logoWhite}
            alt={site.name}
            width={160}
            height={44}
            priority
            className="h-9 w-auto object-contain"
          />
        </div>

        {/* Headline Singkat & Elegan */}
        <div className="relative z-10 max-w-md space-y-3">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white xl:text-4xl">
            {t("loginPanelTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            {site.name} — Real Estate Management System
          </p>
        </div>

        {/* Footer Hak Cipta */}
        <div className="relative z-10 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} {site.name}. Batam, Kepulauan Riau.
          </p>
        </div>
      </aside>

      {/* Panel Kanan: Form Login di Sebelah Kanan */}
      <main className="flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        {/* Navigasi Atas: Logo Mobile & Link Kembali ke Web */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <Image
              src={site.logo}
              alt={site.name}
              width={120}
              height={32}
              className="h-7 w-auto object-contain"
            />
          </div>
          <NextLink
            href="/id"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            <span>{t("loginBackToWeb")}</span>
          </NextLink>
        </div>

        {/* Area Form Login */}
        <div className="mx-auto my-auto w-full max-w-sm py-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer Bawah */}
        <div className="text-center text-[11px] text-slate-400 lg:text-left">
          <p>{t("loginSecurityNote")}</p>
        </div>
      </main>
    </div>
  );
}
