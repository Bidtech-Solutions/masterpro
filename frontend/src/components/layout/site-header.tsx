import { LogIn } from "lucide-react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Logo } from "@/components/common/logo";
import { Link } from "@/i18n/navigation";

import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/** Header website (PRD WEB-G-01, DESIGN.md §0). */
export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white shadow-nav">
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 transition-transform active:scale-95" aria-label={t("home")}>
          <Logo priority />
        </Link>
        <nav className="hidden md:block" aria-label={t("mainNav")}>
          <NavLinks />
        </nav>
        <div className="flex items-center gap-3 md:gap-4">
          <Suspense>
            <LocaleSwitcher className="hidden sm:flex" />
          </Suspense>
          <NextLink
            href="/dashboard/login"
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 font-display text-body-sm font-bold text-white shadow-card transition-all hover:bg-blue-700 hover:shadow-card-hover active:scale-95"
          >
            <LogIn className="size-4" aria-hidden />
            {t("login")}
          </NextLink>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
