"use client";

import { useTranslations } from "next-intl";

interface WelcomeBannerProps {
  userName: string;
  activeProperties: number;
  standbyAgents: number;
}

export function WelcomeBanner({ userName, activeProperties, standbyAgents }: WelcomeBannerProps) {
  const t = useTranslations("dashboard");

  // Format today's date in Indonesian style
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#162E52] bg-gradient-to-r from-[#071833] via-[#0A1F3E] to-[#0E274D] p-6 text-white shadow-sm sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Section: Greeting & Info */}
        <div className="max-w-2xl">
          <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            {t("welcomeBack", { name: userName })}
          </h1>

          <p className="mt-1.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
            {t("bannerDesc", { date: todayFormatted })}
          </p>
        </div>

        {/* Right Section: 2 Separate Metric Highlight Cards */}
        <div className="flex shrink-0 flex-wrap items-center gap-3.5 self-start lg:self-center">
          {/* Card 1: Total Properti Aktif */}
          <div className="min-w-[140px] rounded-xl border border-[#1E3A63] bg-[#102443]/90 px-4.5 py-3 shadow-inner">
            <p className="text-[11px] font-medium text-slate-300">{t("totalActiveProperties")}</p>
            <p className="mt-0.5 font-display text-xl font-bold tracking-tight text-white">
              {t("unitUnit", { count: activeProperties })}
            </p>
          </div>

          {/* Card 2: Agen Standby */}
          <div className="min-w-[140px] rounded-xl border border-[#1E3A63] bg-[#102443]/90 px-4.5 py-3 shadow-inner">
            <p className="text-[11px] font-medium text-slate-300">{t("agentsStandby")}</p>
            <p className="mt-0.5 font-display text-xl font-bold tracking-tight text-white">
              {t("mitraCount", { count: standbyAgents })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
