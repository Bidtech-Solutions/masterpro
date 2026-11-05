"use client";

import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import { dashboardNav } from "@/config/navigation";
import { site } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { DashboardSummaryResponse } from "@/types/dashboard";

const icons: Record<(typeof dashboardNav)[number]["label"], LucideIcon> = {
  overview: LayoutDashboard,
  properties: Building2,
  agents: Users,
  users: UserCog,
  account: UserCircle,
};

/** Kerangka dashboard (DESIGN.md §6.8): sidebar dark navy + badge pill + profile footer */
export function DashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<{ properties?: number; agents?: number }>({});

  useEffect(() => {
    let mounted = true;
    async function loadSummaryCounts() {
      try {
        const summary = await apiRequest<DashboardSummaryResponse>("/dashboard/summary");
        if (mounted && summary) {
          setBadgeCounts({
            properties: summary.properties?.total ?? 0,
            agents: summary.agents?.total ?? summary.agents?.active ?? 0,
          });
        }
      } catch {
        // Fallback silently if not logged in or network error
      }
    }

    void loadSummaryCounts();

    const handleRefresh = () => {
      void loadSummaryCounts();
    };
    window.addEventListener("masterpro-summary-refresh", handleRefresh);

    return () => {
      mounted = false;
      window.removeEventListener("masterpro-summary-refresh", handleRefresh);
    };
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-body-sm text-slate-500">
        {t("loading")}
      </div>
    );
  }

  const items = dashboardNav.filter((i) => (i.roles as readonly string[]).includes(user.role));

  const roleText = user.role === "admin" ? t("superAdmin") : t("roleAgent");

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-800">
      {/* Mobile Topbar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-navy-800 bg-[#071529] px-4 text-white lg:hidden">
        <NextLink href="/dashboard" className="flex items-center gap-2">
          <Image
            src={site.logoWhite}
            alt={site.name}
            width={140}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </NextLink>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-300 hover:bg-[#132A4A] hover:text-white"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col bg-[#071529] text-slate-300 transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:flex lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center px-6">
          <NextLink href="/dashboard" className="flex items-center gap-2">
            <Image
              src={site.logoWhite}
              alt={site.name}
              width={160}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </NextLink>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1.5">
            {items.map((item) => {
              const Icon = icons[item.label];
              const active =
                item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              const badge =
                item.label === "properties"
                  ? badgeCounts.properties
                  : item.label === "agents"
                    ? badgeCounts.agents
                    : undefined;

              return (
                <li key={item.href}>
                  <NextLink
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-[#132A4A] text-white shadow-xs"
                        : "text-slate-300 hover:bg-[#0E223D] hover:text-white",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "size-5 transition-colors",
                          active ? "text-[#38BDF8]" : "text-slate-400 group-hover:text-slate-200",
                        )}
                        aria-hidden
                      />
                      <span>{t(`menu.${item.label}`)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {badge !== undefined && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                            active ? "bg-[#1E3E6B] text-[#7DD3FC]" : "bg-[#162D4E] text-[#38BDF8]",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                      {active && <ChevronRight className="size-4 text-sky-400/80" aria-hidden />}
                    </div>
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Footer */}
        <div className="border-t border-[#122543] p-4">
          <div className="flex items-center justify-between rounded-lg bg-[#0C1E36] p-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-600">
                <Image
                  src="/images/avatar-siti.png"
                  alt={user.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs leading-tight font-bold text-white">{user.name}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span className="truncate">{roleText}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void logout()}
              title={t("logout")}
              aria-label={t("logout")}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-[#162D4E] hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col pt-16 lg:pt-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
