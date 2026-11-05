"use client";

import { Clock, Eye, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AgentReadinessCard } from "@/components/dashboard/agent-readiness-card";
import { ExcelExportCard } from "@/components/dashboard/excel-export-card";
import { KpiStatCards } from "@/components/dashboard/kpi-stat-cards";
import { TopViewedProperties } from "@/components/dashboard/top-viewed-properties";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api/client";
import type { Agent } from "@/types/agent";
import type { DashboardSummaryResponse } from "@/types/dashboard";

const emptySummary: DashboardSummaryResponse = {
  properties: {
    total: 0,
    draft: 0,
    active: 0,
    sold: 0,
    rented: 0,
    inactive: 0,
  },
  agents: {
    total: 0,
    active: 0,
  },
  totals: {
    view_count: 0,
    whatsapp_click_count: 0,
  },
  top_viewed: [],
  recently_updated: [],
};

/**
 * Ringkasan Dashboard Admin/Agen (DESIGN.md §7.2, API.md §13).
 * Seluruh metrik disinkronkan langsung dari database tanpa angka dummy.
 */
export default function DashboardOverviewPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse>(emptySummary);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadOverviewData() {
      try {
        const [summaryData, agentsData] = await Promise.all([
          apiRequest<DashboardSummaryResponse>("/dashboard/summary"),
          apiRequest<Agent[]>("/agents?per_page=100").catch(() => [] as Agent[]),
        ]);
        if (mounted && summaryData) {
          setSummary({
            properties: summaryData.properties ?? emptySummary.properties,
            agents: summaryData.agents ?? emptySummary.agents,
            totals: summaryData.totals ?? emptySummary.totals,
            top_viewed: Array.isArray(summaryData.top_viewed) ? summaryData.top_viewed : [],
            recently_updated: Array.isArray(summaryData.recently_updated)
              ? summaryData.recently_updated
              : [],
          });
        }
        if (mounted && Array.isArray(agentsData)) {
          setAgents(agentsData);
        }
      } catch {
        // Keep emptySummary if request fails
      }
    }

    void loadOverviewData();
    return () => {
      mounted = false;
    };
  }, []);

  const activeProps = summary.properties?.active ?? 0;
  const activeAgents = summary.agents?.active ?? agents.filter((a) => a.user?.status === "active").length;
  const totalAgents = summary.agents?.total ?? agents.length;

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: t("statusActive"),
          cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
        };
      case "draft":
        return {
          label: t("statusDraft"),
          cls: "bg-amber-50 text-amber-700 ring-amber-200/80",
        };
      case "sold":
        return {
          label: t("statusSold"),
          cls: "bg-indigo-50 text-indigo-700 ring-indigo-200/80",
        };
      case "rented":
        return {
          label: t("statusRented"),
          cls: "bg-cyan-50 text-cyan-700 ring-cyan-200/80",
        };
      default:
        return {
          label: t("statusInactive"),
          cls: "bg-slate-100 text-slate-600 ring-slate-200",
        };
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Welcome Greeting Banner */}
      <WelcomeBanner
        userName={user?.name ?? "Admin MasterPro"}
        activeProperties={activeProps}
        standbyAgents={activeAgents}
      />

      {/* 2. Excel Official Report Export Card */}
      <ExcelExportCard onCustomizeFilter={() => router.push("/dashboard/properties")} />

      {/* 3. 4 KPI Summary Cards (Total Listing, Tayang, Terjual, Tersewa) */}
      <KpiStatCards summary={summary.properties} />

      {/* 4. Grid Kesiapan Agen & Aktivitas Interaksi Database */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kiri: Kesiapan Jaringan Agen */}
        {(!user || user.role === "admin") && (
          <div className="lg:col-span-7">
            <AgentReadinessCard
              activeAgents={activeAgents}
              totalAgents={totalAgents}
              agents={agents}
            />
          </div>
        )}

        {/* Kanan: Total Interaksi Publik & Pembaruan Properti Terkini */}
        <div
          className={
            !user || user.role === "admin"
              ? "flex flex-col gap-6 lg:col-span-5"
              : "grid grid-cols-1 gap-6 lg:col-span-12 lg:grid-cols-2"
          }
        >
          {/* Kartu Akumulasi Tayangan & Klik WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  {t("totalPublicViews")}
                </span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Eye className="size-4" aria-hidden />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-slate-900">
                {(summary.totals?.view_count ?? 0).toLocaleString("id-ID")}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  {t("totalWaClicks")}
                </span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <MessageCircle className="size-4" aria-hidden />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-emerald-600">
                {(summary.totals?.whatsapp_click_count ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Kartu Pembaruan Properti Terkini */}
          <div className="flex-1 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center gap-2.5 pb-3.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Clock className="size-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{t("recentlyUpdatedTitle")}</h2>
                <p className="text-[11px] text-slate-500">{t("recentlyUpdatedSubtitle")}</p>
              </div>
            </div>

            {summary.recently_updated.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-xs text-slate-500">
                {t("noRecentUpdates")}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recently_updated.slice(0, 4).map((item) => {
                  const badge = statusBadge(item.status);
                  const dateFormatted = new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(item.updated_at));

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">{item.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-mono font-semibold text-blue-600">{item.code}</span>
                          <span>•</span>
                          <span>{dateFormatted}</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Most Viewed Properties Table */}
      <TopViewedProperties properties={summary.top_viewed} />
    </div>
  );
}
