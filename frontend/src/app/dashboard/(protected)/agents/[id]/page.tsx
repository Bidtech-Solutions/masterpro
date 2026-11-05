"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Search,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api/client";
import type { Agent } from "@/types/agent";
import type { DashboardProperty } from "@/types/property";

interface AgentListingItem {
  id: string;
  slug: string;
  code: string;
  title: string;
  category: string;
  categoryLabel: string;
  addressSpecs: string;
  price: number;
  priceSuffix?: string;
  views: number;
  status: "active" | "sold" | "rented" | "draft" | "inactive";
  statusLabel: string;
  imageUrl: string;
}

const SLUG_TO_CATEGORY: Record<string, string> = {
  rumah: "house",
  apartemen: "apartment",
  ruko: "shophouse",
  villa: "villa",
  tanah: "land",
  gudang: "warehouse",
  kantor: "office",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Tayang",
  sold: "Terjual",
  rented: "Tersewa",
  draft: "Draf",
  inactive: "Nonaktif",
};

function mapPropertyToAgentListing(prop: DashboardProperty): AgentListingItem {
  const specsParts: string[] = [];
  if (prop.location?.district || prop.location?.city?.name) {
    specsParts.push([prop.location.district, prop.location.city?.name].filter(Boolean).join(", "));
  }
  const areaParts: string[] = [];
  if (prop.building_area) areaParts.push(`LB ${prop.building_area}m²`);
  if (prop.land_area) areaParts.push(`LT ${prop.land_area}m²`);
  if (areaParts.length > 0) {
    specsParts.push(areaParts.join(" / "));
  }

  const rawSlug = prop.property_type?.slug || "rumah";
  const category = SLUG_TO_CATEGORY[rawSlug] || rawSlug;

  return {
    id: prop.id,
    slug: prop.slug,
    code: prop.code,
    title: prop.title,
    category,
    categoryLabel: prop.property_type?.name_id || rawSlug,
    addressSpecs: specsParts.join(" • ") || prop.location?.city?.name || "Kota Batam",
    price: prop.price,
    priceSuffix:
      prop.listing_type === "rent" && prop.rent_period
        ? prop.rent_period === "yearly"
          ? "/thn"
          : "/bln"
        : undefined,
    views: prop.view_count ?? 0,
    status: prop.status,
    statusLabel: STATUS_LABELS[prop.status] || prop.status,
    imageUrl: prop.cover_image?.url || "/images/prop-thumb-1.png",
  };
}

function AgentDetailContent() {
  const t = useTranslations("dashboard");
  const params = useParams();
  const searchParams = useSearchParams();

  const agentId = (params?.id as string) || "";
  const initialTab = searchParams.get("tab") === "history" ? "history" : "active";

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [agentProperties, setAgentProperties] = useState<AgentListingItem[]>([]);

  const [activeTab, setActiveTab] = useState<"active" | "history">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 4;

  // Fetch real agent and real properties from backend
  useEffect(() => {
    let mounted = true;
    async function loadAgentAndProperties() {
      if (!agentId) return;
      try {
        const res = await apiRequest<Agent>(`/agents/${agentId}`);
        if (mounted && res && res.id) {
          setAgent(res);
        }

        const propsRes = await apiRequest<DashboardProperty[]>(
          `/properties?agent_id=${agentId}&per_page=100`,
        );
        if (mounted && Array.isArray(propsRes)) {
          setAgentProperties(propsRes.map(mapPropertyToAgentListing));
        }
      } catch {
        if (mounted) {
          setAgent(null);
        }
      } finally {
        if (mounted) {
          setIsLoadingAgent(false);
        }
      }
    }
    void loadAgentAndProperties();
    return () => {
      mounted = false;
    };
  }, [agentId]);

  const activeListings = useMemo(
    () => agentProperties.filter((p) => p.status === "active"),
    [agentProperties],
  );
  const historyListings = useMemo(
    () => agentProperties.filter((p) => p.status === "sold" || p.status === "rented"),
    [agentProperties],
  );

  const handleTabChange = (tab: "active" | "history") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const rawListings = activeTab === "active" ? activeListings : historyListings;
  const filteredListings = useMemo(() => {
    return rawListings.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchSpecs = item.addressSpecs.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchSpecs) {
          return false;
        }
      }
      return true;
    });
  }, [rawListings, selectedCategory, searchQuery]);

  const totalFiltered = filteredListings.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginatedListings = filteredListings.slice(startIndex, startIndex + perPage);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getWhatsAppLink = (wa: string) => {
    const clean = wa.replace(/[^0-9]/g, "");
    return `https://wa.me/${clean}`;
  };

  if (isLoadingAgent) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-xs text-slate-400">
        Memuat ringkasan profil agen dari database...
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-bold text-slate-800">Agen tidak ditemukan</p>
        <p className="mt-1 text-xs text-slate-500">
          Data agen dengan ID tersebut tidak tersedia di database.
        </p>
        <NextLink
          href="/dashboard/agents"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Daftar Agen</span>
        </NextLink>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <NextLink
          href="/dashboard/agents"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Manajemen Agen</span>
        </NextLink>
        <span>/</span>
        <span className="font-bold text-slate-900">{agent.user.name}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {t("agentSummaryTitle")}
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          {t("agentSummarySubtitle")}
        </p>
      </div>

      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs sm:size-24">
              {agent.user.avatar_url ? (
                <Image
                  src={agent.user.avatar_url}
                  alt={agent.user.name}
                  width={96}
                  height={96}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-sky-100 font-display text-xl font-extrabold text-sky-800">
                  {agent.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-black text-slate-900 sm:text-2xl">
                  {agent.user.name}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    agent.user.status === "active"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {agent.user.status === "active" ? "Aktif" : "Nonaktif / Cuti"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Phone className="size-3.5 text-slate-400" />
                  <span>{agent.user.phone || `+${agent.whatsapp_number}`}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-500">
                  <Mail className="size-3.5 text-slate-400" />
                  <span>{agent.user.email}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                {agent.bio || agent.service_area || "Property Consultant MasterPro"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={getWhatsAppLink(agent.whatsapp_number)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#16A34A] sm:text-sm"
            >
              <MessageCircle className="size-4 shrink-0" />
              <span>{t("chatWhatsappBtn")}</span>
            </a>

            <NextLink
              href={`/dashboard/agents/${agent.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#0369A1] sm:text-sm"
            >
              <Pencil className="size-4 shrink-0" />
              <span>{t("editAgentProfileBtn")}</span>
            </NextLink>
          </div>
        </div>
      </div>

      {/* Main Container Card: Tab Listing Aktif & Riwayat Transaksi */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex gap-8 border-b border-slate-100 px-6 pt-4">
          <button
            type="button"
            onClick={() => handleTabChange("active")}
            className={`relative flex items-center gap-2 pb-3 text-xs font-bold transition-all sm:text-sm ${
              activeTab === "active"
                ? "text-sky-600 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-sky-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>{t("tabActiveListings")}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                activeTab === "active"
                  ? "bg-sky-50 text-sky-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {activeListings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("history")}
            className={`relative flex items-center gap-2 pb-3 text-xs font-bold transition-all sm:text-sm ${
              activeTab === "history"
                ? "text-sky-600 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-sky-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>{t("tabTransactionHistory")}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                activeTab === "history"
                  ? "bg-sky-50 text-sky-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {historyListings.length}
            </span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("searchListingPlaceholderShort")}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-10 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "Semua" },
              { id: "house", label: "Rumah" },
              { id: "apartment", label: "Apartemen" },
              { id: "shophouse", label: "Ruko" },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Property Row List */}
        {paginatedListings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Belum ada data properti pada kategori ini untuk agen {agent.user.name}.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedListings.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:p-6"
              >
                <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-2xs sm:h-22 sm:w-32">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div>
                      <span
                        className={`inline-block text-[11px] font-bold ${
                          item.status === "active"
                            ? "text-emerald-600"
                            : item.status === "sold"
                              ? "text-indigo-600"
                              : "text-sky-600"
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>

                    <NextLink
                      href={`/id/properties/${item.slug}`}
                      className="block truncate font-display text-sm font-black text-slate-900 transition-colors hover:text-sky-600 sm:text-base"
                    >
                      {item.title}
                    </NextLink>

                    <p className="line-clamp-1 text-xs text-slate-400">
                      {item.addressSpecs}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 space-y-1 text-left sm:text-right">
                  <div className="font-display text-base font-black text-slate-900 sm:text-lg">
                    {formatPrice(item.price)}
                    {item.priceSuffix && (
                      <span className="text-xs font-bold text-slate-500">
                        {item.priceSuffix}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs sm:justify-end">
                    <span className="text-slate-400">{item.views} views</span>
                    <NextLink
                      href={`/id/properties/${item.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-sky-600 transition-colors hover:text-sky-700"
                    >
                      <span>{t("viewDetailLink")}</span>
                      <span>&gt;</span>
                    </NextLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">
            {t("showingListingsCount", {
              shown: paginatedListings.length,
              total: filteredListings.length,
              type: activeTab === "active" ? "aktif" : "riwayat",
            })}
          </p>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft className="size-3.5" />
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
              className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center text-xs text-slate-400">
          Memuat ringkasan profil agen...
        </div>
      }
    >
      <AgentDetailContent />
    </Suspense>
  );
}
