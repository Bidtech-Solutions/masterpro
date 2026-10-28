"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Pengalih bahasa ID/EN yang mempertahankan halaman & query (PRD WEB-G-01). */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(
        // pathname bertipe template internal ("/properties/[slug]"); params mengisi segmen dinamis.
        { pathname, params, query: Object.fromEntries(searchParams.entries()) } as Parameters<
          typeof router.replace
        >[0],
        { locale: next, scroll: false },
      );
    });
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "flex items-center rounded-full border border-slate-200 bg-slate-100 p-1",
        pending && "opacity-70",
        className,
      )}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          aria-pressed={l === locale}
          lang={l}
          className={cn(
            "rounded-full px-2.5 py-1 text-caption font-semibold uppercase transition-colors",
            l === locale ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-900",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
