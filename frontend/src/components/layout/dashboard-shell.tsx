"use client";

import {
  Building2,
  LayoutDashboard,
  LogOut,
  UserCircle,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { dashboardNav } from "@/config/navigation";
import { site } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const icons: Record<(typeof dashboardNav)[number]["label"], LucideIcon> = {
  overview: LayoutDashboard,
  properties: Building2,
  agents: Users,
  users: UserCog,
  account: UserCircle,
};

/** Kerangka dashboard (DESIGN.md §6.8): sidebar navy + topbar putih. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-body-sm text-slate-500">
        {t("loading")}
      </div>
    );
  }

  const items = dashboardNav.filter((i) => (i.roles as readonly string[]).includes(user.role));

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-66 shrink-0 flex-col bg-navy-900 text-slate-300 lg:flex">
        <div className="px-6 py-6">
          <Image
            src={site.logoWhite}
            alt={site.name}
            width={800}
            height={592}
            className="h-12 w-auto"
            priority
          />
        </div>
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = icons[item.label];
              const active =
                item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <NextLink
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md border-l-4 px-3 py-2.5 text-body-sm font-medium transition-colors",
                      active
                        ? "border-sky-300 bg-navy-700 text-white"
                        : "border-transparent hover:bg-navy-800 hover:text-white",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    {t(`menu.${item.label}`)}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-navy-800 p-4">
          <p className="truncate text-body-sm font-semibold text-white">{user.name}</p>
          <p className="mb-3 text-caption text-slate-400">
            {user.role === "admin" ? t("roleAdmin") : t("roleAgent")}
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 text-body-sm text-slate-300 hover:text-white"
          >
            <LogOut className="size-4" aria-hidden />
            {t("logout")}
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="font-display text-body font-bold text-navy-900">{t("title")}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-body-sm text-slate-500 hover:text-navy-900 lg:hidden"
          >
            {t("logout")}
          </button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
