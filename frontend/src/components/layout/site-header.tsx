import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Logo } from "@/components/common/logo";
import { Link } from "@/i18n/navigation";

import { HeaderAuthButton } from "./header-auth-button";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/** Header website (PRD WEB-G-01, DESIGN.md §0). */
export async function SiteHeader() {
  const t = await getTranslations("nav");
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("mp_access");

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
          <HeaderAuthButton initialLoggedIn={hasSession} />
          <MobileMenu initialLoggedIn={hasSession} />
        </div>
      </div>
    </header>
  );
}
