"use client";

import { useTranslations } from "next-intl";

import { useAuth } from "@/hooks/use-auth";

/**
 * Ringkasan dashboard (DESIGN.md §7.2).
 * TODO: kartu statistik & tabel dari GET /dashboard/summary (API.md §13).
 */
export default function DashboardOverviewPage() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  return (
    <div>
      <h1 className="mb-2 font-display text-h2 font-bold text-navy-900">
        {t("welcome", { name: user?.name ?? "" })}
      </h1>
      <p className="text-body-sm text-slate-500">{t("overviewPlaceholder")}</p>
    </div>
  );
}
