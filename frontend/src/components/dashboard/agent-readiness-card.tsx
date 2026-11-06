"use client";

import { ArrowRight, UserCheck } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import type { Agent } from "@/types/agent";

interface AgentReadinessCardProps {
  activeAgents?: number;
  totalAgents?: number;
  agents?: Agent[];
}

export function AgentReadinessCard({ agents = [] }: AgentReadinessCardProps) {
  const t = useTranslations("dashboard");

  const sortedAgents = [...agents].sort((a, b) => {
    const aClosing = (a.listing_counts?.sold ?? 0) + (a.listing_counts?.rented ?? 0);
    const bClosing = (b.listing_counts?.sold ?? 0) + (b.listing_counts?.rented ?? 0);
    if (bClosing !== aClosing) return bClosing - aClosing;
    return (b.listing_counts?.active ?? 0) - (a.listing_counts?.active ?? 0);
  });

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UserCheck className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{t("agentReadinessTitle")}</h2>
              <p className="text-xs text-slate-500">{t("agentReadinessSubtitle")}</p>
            </div>
          </div>
        </div>

        {/* Real Database Agents List */}
        {sortedAgents.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-xs text-slate-500">
            {t("noAgentsRegistered")}
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {sortedAgents.slice(0, 4).map((agent) => {
              const closingCount = (agent.listing_counts?.sold ?? 0) + (agent.listing_counts?.rented ?? 0);
              const activeCount = agent.listing_counts?.active ?? 0;
              const initial = (agent.user?.name || "A").charAt(0).toUpperCase();

              return (
                <NextLink
                  key={agent.id}
                  href={`/dashboard/agents/${agent.id}`}
                  className="flex items-center justify-between rounded-xl border border-blue-100/80 bg-[#F0F6FF]/60 p-3.5 transition-colors hover:border-blue-200 hover:bg-[#F0F6FF]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0B1F3F] text-xs font-bold text-white shadow-2xs ring-2 ring-white">
                      {agent.user?.avatar_url ? (
                        <Image
                          src={agent.user.avatar_url}
                          alt={agent.user.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900">{agent.user?.name}</p>
                        <span className="rounded bg-blue-100/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                          {agent.agent_code}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {agent.service_area || agent.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-3 text-right">
                    <p className="text-xs font-bold text-[#1E3A8A] sm:text-sm">
                      {t("closingCount", { count: closingCount })}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
                      {t("activeListingCount", { count: activeCount })}
                    </p>
                  </div>
                </NextLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Action - Clean & Simple */}
      <div className="mt-4 flex justify-end border-t border-slate-100 pt-3.5">
        <NextLink
          href="/dashboard/agents"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          <span>{t("manageAllAgents")}</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </NextLink>
      </div>
    </div>
  );
}
