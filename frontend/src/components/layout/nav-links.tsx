"use client";

import { useTranslations } from "next-intl";

import { headerNav } from "@/config/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Menu utama header dengan penanda halaman aktif (DESIGN.md §0 Header). */
export function NavLinks({
  orientation = "horizontal",
  onNavigate,
}: {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <ul className={cn(orientation === "horizontal" ? "flex items-center gap-8" : "flex flex-col gap-1")}>
      {headerNav.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-body-sm transition-colors",
                orientation === "horizontal"
                  ? "border-b-2 pb-1"
                  : "block rounded-md px-3 py-3 text-body hover:bg-blue-50",
                active
                  ? "border-blue-600 font-bold text-blue-600"
                  : "border-transparent font-medium text-slate-700 hover:text-blue-600",
              )}
            >
              {t(item.label)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
