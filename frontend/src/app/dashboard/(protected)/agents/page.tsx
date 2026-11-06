"use client";

import { Eye, MessageCircle, Pencil, UserPlus } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api/client";
import type { Agent } from "@/types/agent";

export default function AgentsDashboardPage() {
  const t = useTranslations("dashboard");

  const [dbAgents, setDbAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    let mounted = true;
    async function fetchAgents() {
      setIsLoading(true);
      try {
        const res = await apiRequest<Agent[]>("/agents?per_page=100");
        if (mounted && Array.isArray(res)) {
          setDbAgents(res);
        }
      } catch {
        if (mounted) {
          setDbAgents([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    void fetchAgents();
    return () => {
      mounted = false;
    };
  }, []);

  const totalAgents = dbAgents.length;
  const totalPages = Math.max(1, Math.ceil(totalAgents / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginatedAgents = dbAgents.slice(startIndex, startIndex + perPage);

  const getWhatsAppLink = (wa: string) => {
    const clean = wa.replace(/[^0-9]/g, "");
    return `https://wa.me/${clean}`;
  };

  const formatPhoneDisplay = (num: string) => {
    const clean = num.replace(/[^0-9]/g, "");
    if (clean.startsWith("62")) {
      const rest = clean.slice(2);
      if (rest.length >= 7) {
        return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
      }
      return `+62 ${rest}`;
    }
    return num;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("agentsManagementTitle")}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {t("agentsManagementSubtitle")}
          </p>
        </div>

        <NextLink
          href="/dashboard/agents/new"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0284C7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] active:scale-[0.98] sm:self-auto sm:text-sm"
        >
          <UserPlus className="size-4" />
          <span>{t("addAgentBtn")}</span>
        </NextLink>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <th scope="col" className="px-6 py-4">
                  {t("thAgentCol")}
                </th>
                <th scope="col" className="px-6 py-4">
                  {t("thContactCol")}
                </th>
                <th scope="col" className="px-6 py-4 text-center">
                  {t("thActionCol")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-xs text-slate-400">
                    Memuat data agen dari database...
                  </td>
                </tr>
              ) : paginatedAgents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-xs text-slate-400">
                    Belum ada agen terdaftar di database. Klik &ldquo;{t("addAgentBtn")}&rdquo; untuk menambahkan agen pertama.
                  </td>
                </tr>
              ) : (
                paginatedAgents.map((ag) => {
                  const initials = getInitials(ag.user.name);
                  const isActive = ag.user.status === "active";
                  const avatar = ag.user.avatar_url;

                  return (
                    <tr
                      key={ag.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* 1. AGEN */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <NextLink
                            href={`/dashboard/agents/${ag.id}`}
                            className="relative size-11 sm:size-12 shrink-0 block hover:opacity-90 transition-opacity"
                          >
                            <div className="size-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                              {avatar ? (
                                <Image
                                  src={avatar}
                                  alt={ag.user.name}
                                  width={48}
                                  height={48}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center bg-sky-100 text-xs font-bold text-sky-800">
                                  {initials}
                                </div>
                              )}
                            </div>
                            <span
                              className={`absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-white ${
                                isActive ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                              title={isActive ? "Aktif" : "Nonaktif / Cuti"}
                            />
                          </NextLink>

                          <div className="min-w-0">
                            <NextLink
                              href={`/dashboard/agents/${ag.id}`}
                              className="font-bold text-xs sm:text-sm text-slate-900 hover:text-sky-600 transition-colors block"
                            >
                              {ag.user.name}
                            </NextLink>
                            <p className="text-xs text-slate-400">
                              {ag.bio || ag.service_area || "Property Consultant"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. KONTAK & WHATSAPP */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <a
                            href={getWhatsAppLink(ag.whatsapp_number)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-800 hover:text-emerald-600 transition-colors"
                          >
                            <span>{formatPhoneDisplay(ag.whatsapp_number)}</span>
                            <MessageCircle className="size-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                          </a>
                          <p className="text-xs text-slate-400">
                            {ag.user.email}
                          </p>
                        </div>
                      </td>

                      {/* 3. AKSI */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <NextLink
                            href={`/dashboard/agents/${ag.id}`}
                            title={t("viewAgentDetail")}
                            className="rounded-lg p-2 text-sky-600 hover:bg-sky-50 transition-colors"
                          >
                            <Eye className="size-4" />
                          </NextLink>

                          <NextLink
                            href={`/dashboard/agents/${ag.id}/edit`}
                            title={t("editAgent")}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            <Pencil className="size-4" />
                          </NextLink>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">
            {t("showingAgentsCount", {
              start: totalAgents === 0 ? 0 : startIndex + 1,
              end: Math.min(startIndex + perPage, totalAgents),
              total: totalAgents,
            })}
          </p>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            >
              {t("prevPage")}
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`size-7 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-[#0284C7] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            >
              {t("nextPage")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
