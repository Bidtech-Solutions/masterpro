import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LoginForm } from "@/components/dashboard/login-form";
import { site } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("submitLogin") };
}

/** Halaman login dashboard (AUTH-01, DESIGN.md §7.2). */
export default async function LoginPage() {
  const t = await getTranslations("dashboard");
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -right-16 size-96 rounded-full border-[32px] border-white/10" />
        <Image
          src={site.logoWhite}
          alt={site.name}
          width={800}
          height={592}
          className="relative h-16 w-auto self-start"
          priority
        />
        <p className="relative max-w-md font-display text-h1 font-extrabold">{t("loginPanelTitle")}</p>
      </div>
      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 font-display text-h2 font-bold text-navy-900">{t("loginTitle")}</h1>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
