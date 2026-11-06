"use client";

import { BadgeCheck, Building, CheckCircle2, FileText, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PropertiesSummary } from "@/types/dashboard";

interface KpiStatCardsProps {
  summary: PropertiesSummary;
}

export function KpiStatCards({ summary }: KpiStatCardsProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Listing */}
      <div className="relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {t("totalListing")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Building className="size-4" aria-hidden />
          </div>
        </div>

        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{summary.total}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <FileText className="size-3.5 text-slate-400" aria-hidden />
            <span>
              {t("draftInactiveBreakdown", {
                draft: summary.draft,
                inactive: summary.inactive,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tayang */}
      <div className="relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{t("tayang")}</span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-4" aria-hidden />
          </div>
        </div>

        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{summary.active}</p>
          <div className="mt-2">
            <span className="inline-block rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {t("activePublic")}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Terjual */}
      <div className="relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {t("terjual")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <BadgeCheck className="size-4" aria-hidden />
          </div>
        </div>

        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{summary.sold}</p>
          <div className="mt-2">
            <span className="inline-block rounded-md border border-indigo-200/80 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {t("closingDeal")}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tersewa */}
      <div className="relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {t("tersewa")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
            <KeyRound className="size-4" aria-hidden />
          </div>
        </div>

        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{summary.rented}</p>
          <div className="mt-2">
            <span className="inline-block rounded-md border border-cyan-200/80 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
              {t("activeRent")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
