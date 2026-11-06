"use client";

import {
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  Home,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Rocket,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api/client";
import { downloadPropertiesExcel } from "@/lib/api/export";
import type { DashboardProperty, ListingType, PropertyStatus } from "@/types/property";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() || "MP";
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function formatPriceDisplay(price: number, listingType: ListingType, rentPeriod: string | null): string {
  if (listingType === "rent") {
    const periodSuffix = rentPeriod === "monthly" ? "/bln" : "/thn";
    if (price >= 1_000_000_000) {
      const b = (price / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 });
      return `Rp ${b} M${periodSuffix}`;
    }
    if (price >= 1_000_000) {
      const m = (price / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 });
      return `Rp ${m} Jt${periodSuffix}`;
    }
    return `Rp ${price.toLocaleString("id-ID")}${periodSuffix}`;
  }
  return `Rp ${price.toLocaleString("id-ID")}`;
}

export default function PropertiesDashboardPage() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionFilter, setTransactionFilter] = useState<"all" | "sale" | "rent">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 7;

  // Data state
  const [dbProperties, setDbProperties] = useState<DashboardProperty[]>([]);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Status popover state
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Tutup popover saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!openStatusMenuId && !openActionMenuId) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("[data-popover-container]")) {
        setOpenStatusMenuId(null);
        setOpenActionMenuId(null);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenStatusMenuId(null);
        setOpenActionMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openStatusMenuId, openActionMenuId]);

  // Export Excel loading state
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setToast({ message: "Menyiapkan file spreadsheet Excel...", isError: false });
      await downloadPropertiesExcel({
        q: searchQuery || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        listing_type: transactionFilter === "all" ? undefined : transactionFilter,
        property_type: typeFilter === "all" ? undefined : typeFilter,
        city: cityFilter === "all" ? undefined : cityFilter,
        agent_id: agentFilter === "all" ? undefined : agentFilter,
        sort: sortOrder,
      });
      setToast({ message: "Laporan data properti Excel (.xlsx) berhasil diunduh!", isError: false });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Gagal mengunduh laporan Excel",
        isError: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Load properties from backend API
  useEffect(() => {
    let mounted = true;
    async function fetchProperties() {
      try {
        const res = await apiRequest<DashboardProperty[]>("/properties?per_page=100");
        if (mounted && res && Array.isArray(res)) {
          setDbProperties(res);
        }
      } catch {
        if (mounted) {
          setDbProperties([]);
        }
      }
    }

    void fetchProperties();
    return () => {
      mounted = false;
    };
  }, []);

  // Gunakan data asli dari database
  const allProperties = dbProperties;

  // Extract unique agents for dropdown
  const uniqueAgents = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>();
    for (const p of allProperties) {
      if (p.agent && !map.has(p.agent.name)) {
        map.set(p.agent.name, {
          id: p.agent.id,
          name: p.agent.name,
          code: p.agent.agent_code,
        });
      }
    }
    return Array.from(map.values());
  }, [allProperties]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return allProperties.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchDistrict = (p.location.district || "").toLowerCase().includes(q);
        const matchAgent = (p.agent.name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDistrict && !matchAgent) return false;
      }

      // Transaction
      if (transactionFilter !== "all" && p.listing_type !== transactionFilter) return false;

      // Property Type
      if (typeFilter !== "all" && p.property_type.slug !== typeFilter) return false;

      // City Filter (normalisasi spasi agar "Kota Tanjungpinang" cocok dengan "Kota Tanjung Pinang")
      if (cityFilter !== "all") {
        const normPropCity = p.location.city.name.toLowerCase().replace(/\s+/g, "");
        const normFilterCity = cityFilter.toLowerCase().replace(/\s+/g, "");
        if (normPropCity !== normFilterCity) return false;
      }

      // Agent Filter
      if (agentFilter !== "all" && p.agent.id !== agentFilter && p.agent.name !== agentFilter) return false;

      // Status Filter
      if (statusFilter !== "all" && p.status !== statusFilter) return false;

      return true;
    });
  }, [allProperties, searchQuery, transactionFilter, typeFilter, cityFilter, agentFilter, statusFilter]);

  // Sorted properties
  const sortedProperties = useMemo(() => {
    const list = [...filteredProperties];
    switch (sortOrder) {
      case "price_asc":
        return list.sort((a, b) => a.price - b.price);
      case "price_desc":
        return list.sort((a, b) => b.price - a.price);
      case "popular":
        return list.sort((a, b) => b.view_count - a.view_count);
      case "newest":
      default:
        return list.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
    }
  }, [filteredProperties, sortOrder]);

  // Pagination calculation
  const totalCount = sortedProperties.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginatedProperties = sortedProperties.slice(startIndex, startIndex + perPage);

  // Status Change handler
  const handleUpdateStatus = async (propertyId: string, newStatus: PropertyStatus) => {
    setOpenStatusMenuId(null);
    try {
      // If it's a real property from backend DB
      const isReal = dbProperties.some((p) => p.id === propertyId);
      if (isReal) {
        await apiRequest(`/properties/${propertyId}/status`, {
          method: "PATCH",
          body: { status: newStatus },
        });
      }
      // Optimistic update
      setDbProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p)),
      );
      setToast({ message: t("statusChangedSuccess") });
      // Notify sidebar badge to refresh counts
      window.dispatchEvent(new CustomEvent("masterpro-summary-refresh"));
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status properti";
      setToast({ message: msg, isError: true });
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSearchQuery("");
    setTransactionFilter("all");
    setTypeFilter("all");
    setCityFilter("all");
    setAgentFilter("all");
    setStatusFilter("all");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const getStatusBadgeStyle = (status: PropertyStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/90";
      case "draft":
        return "bg-amber-50 text-amber-700 border-amber-200/90";
      case "sold":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/90";
      case "rented":
        return "bg-sky-50 text-sky-700 border-sky-200/90";
      case "inactive":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStatusDotColor = (status: PropertyStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "draft":
        return "bg-amber-500";
      case "sold":
        return "bg-indigo-500";
      case "rented":
        return "bg-sky-500";
      case "inactive":
      default:
        return "bg-slate-400";
    }
  };

  const getStatusLabel = (status: PropertyStatus | "all") => {
    switch (status) {
      case "active":
        return t("statusActive");
      case "draft":
        return t("statusDraft");
      case "sold":
        return t("statusSold");
      case "rented":
        return t("statusRented");
      case "inactive":
        return t("statusInactive");
      case "all":
      default:
        return t("tabAll");
    }
  };

  const getTypeLabel = (slug: string) => {
    switch (slug) {
      case "rumah":
        return "Rumah";
      case "apartemen":
        return "Apartemen";
      case "ruko":
        return "Ruko";
      case "kos":
        return "Gedung Kos";
      case "tanah":
        return "Tanah";
      default:
        return slug;
    }
  };

  const getAgentName = (agentIdOrName: string) => {
    const found = uniqueAgents.find((a) => a.id === agentIdOrName || a.name === agentIdOrName);
    return found ? found.name : agentIdOrName;
  };

  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    transactionFilter !== "all" ||
    typeFilter !== "all" ||
    cityFilter !== "all" ||
    agentFilter !== "all" ||
    statusFilter !== "all";

  const statusCounts = useMemo(() => {
    const counts: Record<PropertyStatus | "all", number> = {
      all: allProperties.length,
      active: 0,
      draft: 0,
      sold: 0,
      rented: 0,
      inactive: 0,
    };
    for (const p of allProperties) {
      if (p.status in counts) {
        counts[p.status] = (counts[p.status] ?? 0) + 1;
      }
    }
    return counts;
  }, [allProperties]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all ${
            toast.isError ? "bg-rose-900 border border-rose-700" : "bg-slate-900"
          }`}
        >
          {toast.isError ? (
            <XCircle className="size-5 text-rose-400" />
          ) : (
            <CheckCircle2 className="size-5 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar matching mockup */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("managePropertiesTitle")}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{t("managePropertiesSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Ekspor Excel Button */}
          {user?.role === "admin" && (
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed sm:text-sm"
              title="Ekspor daftar properti ke file Excel (.xlsx)"
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin text-slate-500" />
              ) : (
                <Download className="size-4 text-emerald-600" />
              )}
              <span>{isExporting ? "Mengekspor..." : t("exportExcel")}</span>
            </button>
          )}

          <NextLink
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] active:scale-[0.98] sm:text-sm"
          >
            <Plus className="size-4" />
            <span>{t("addPropertyNewBtn")}</span>
          </NextLink>
        </div>
      </div>

      {/* Quick Status Mode Tabs (Desktop / Large Screen) */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            statusFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>{t("quickStatusAll")}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              statusFilter === "all" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
            }`}
          >
            {statusCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("active");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            statusFilter === "active"
              ? "bg-emerald-600 text-white shadow-xs"
              : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          <span>{t("quickStatusActive")}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              statusFilter === "active" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {statusCounts.active}
          </span>
        </button>

        {/* Mode Draf - Highlighted & Prominent */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter("draft");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            statusFilter === "draft"
              ? "bg-amber-500 text-white ring-2 ring-amber-400 ring-offset-1 shadow-xs"
              : "border-2 border-amber-300/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100/80"
          }`}
        >
          <span className="inline-block size-2 rounded-full bg-amber-500" />
          <span>{t("quickStatusDraft")}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              statusFilter === "draft" ? "bg-amber-600 text-white" : "bg-amber-200 text-amber-900"
            }`}
          >
            {statusCounts.draft}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("sold");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            statusFilter === "sold"
              ? "bg-indigo-600 text-white shadow-xs"
              : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="inline-block size-2 rounded-full bg-indigo-500" />
          <span>{t("quickStatusSold")}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              statusFilter === "sold" ? "bg-indigo-700 text-white" : "bg-indigo-50 text-indigo-700"
            }`}
          >
            {statusCounts.sold}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("rented");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            statusFilter === "rented"
              ? "bg-sky-600 text-white shadow-xs"
              : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="inline-block size-2 rounded-full bg-sky-500" />
          <span>{t("quickStatusRented")}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              statusFilter === "rented" ? "bg-sky-700 text-white" : "bg-sky-50 text-sky-700"
            }`}
          >
            {statusCounts.rented}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("inactive");
            setCurrentPage(1);
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            statusFilter === "inactive"
              ? "bg-slate-600 text-white shadow-xs"
              : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="inline-block size-2 rounded-full bg-slate-400" />
          <span>{t("quickStatusInactive")}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              statusFilter === "inactive" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {statusCounts.inactive}
          </span>
        </button>
      </div>

      {/* Draft Mode Notice Banner */}
      {statusFilter === "draft" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/70 text-amber-800">
              <Pencil className="size-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950">{t("modeDraft")}</p>
              <p className="text-amber-800/90">{t("modeDraftNotice")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <NextLink
              href="/dashboard/properties/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700 shadow-2xs"
            >
              <Plus className="size-3.5" />
              <span>{t("addProperty")}</span>
            </NextLink>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="rounded-xl border border-amber-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-white"
            >
              {t("quickStatusAll")}
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Card matching mockup */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:p-5">
        {/* Row 1: Search + 4 Filter Dropdowns */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Search Input */}
          <div className="relative md:col-span-4">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("searchListingPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3.5 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden sm:text-sm"
            />
          </div>

          {/* Transaksi Filter */}
          <div className="md:col-span-2">
            <select
              value={transactionFilter}
              onChange={(e) => {
                setTransactionFilter(e.target.value as "all" | "sale" | "rent");
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-hidden"
            >
              <option value="all">{t("filterAllTransactions")}</option>
              <option value="sale">{t("forSale")}</option>
              <option value="rent">{t("forRent")}</option>
            </select>
          </div>

          {/* Tipe Properti Filter */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-hidden"
            >
              <option value="all">{t("allPropertyTypes")}</option>
              <option value="rumah">Rumah</option>
              <option value="apartemen">Apartemen</option>
              <option value="ruko">Ruko</option>
              <option value="kos">Gedung Kos</option>
              <option value="tanah">Tanah</option>
            </select>
          </div>

          {/* Kota Filter */}
          <div className="md:col-span-2">
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-hidden"
            >
              <option value="all">{t("filterAllCities")}</option>
              <option value="Kota Batam">Kota Batam</option>
              <option value="Kota Tanjungpinang">Kota Tanjungpinang</option>
              <option value="Kabupaten Bintan">Kabupaten Bintan</option>
              <option value="Kabupaten Karimun">Kabupaten Karimun</option>
              <option value="Kabupaten Natuna">Kabupaten Natuna</option>
              <option value="Kabupaten Lingga">Kabupaten Lingga</option>
              <option value="Kabupaten Kepulauan Anambas">Kabupaten Kepulauan Anambas</option>
            </select>
          </div>

          {/* Agen Filter */}
          <div className="md:col-span-2">
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-hidden"
            >
              <option value="all">{t("allAgents")}</option>
              {uniqueAgents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Filter Aktif Chips + Urutkan + View Switcher */}
        <div className="mt-3.5 flex flex-col gap-2.5 border-t border-slate-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Sisi Kiri: Filter Aktif Tag Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {t("activeFiltersLabel")}
            </span>

            {/* 1. Pencarian Chip */}
            {searchQuery.trim() !== "" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                <span>
                  {t("filterSearchLabel")}: &ldquo;{searchQuery}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="rounded-full p-0.5 hover:bg-sky-200/60"
                  aria-label="Remove search query filter"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {/* 2. Transaksi Chip */}
            {transactionFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                <span>
                  {t("filterTransactionLabel")}: {transactionFilter === "sale" ? t("forSale") : t("forRent")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTransactionFilter("all");
                    setCurrentPage(1);
                  }}
                  className="rounded-full p-0.5 hover:bg-sky-200/60"
                  aria-label="Remove transaction filter"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {/* 3. Tipe Properti Chip */}
            {typeFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                <span>
                  {t("filterTypeLabel")}: {getTypeLabel(typeFilter)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("all");
                    setCurrentPage(1);
                  }}
                  className="rounded-full p-0.5 hover:bg-sky-200/60"
                  aria-label="Remove property type filter"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {/* 4. Kota Chip */}
            {cityFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                <span>
                  {t("filterCityLabel")}: {cityFilter}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCityFilter("all");
                    setCurrentPage(1);
                  }}
                  className="rounded-full p-0.5 hover:bg-sky-200/60"
                  aria-label="Remove city filter"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {/* 5. Agen Chip */}
            {agentFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                <span>
                  {t("filterAgentLabel")}: {getAgentName(agentFilter)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAgentFilter("all");
                    setCurrentPage(1);
                  }}
                  className="rounded-full p-0.5 hover:bg-sky-200/60"
                  aria-label="Remove agent filter"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {/* 6. Status Chip */}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                <span>
                  {t("filterStatusLabel")}: {getStatusLabel(statusFilter)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className="rounded-full p-0.5 hover:bg-sky-200/60"
                  aria-label="Remove status filter"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {/* Neutral fallback when no filters are set */}
            {!hasActiveFilter && (
              <span className="text-xs text-slate-400 italic">
                {t("quickStatusAll")}
              </span>
            )}

            {/* Reset All Filters Button */}
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-semibold text-rose-500 transition-colors hover:text-rose-600 hover:underline"
              >
                {t("resetFilter")}
              </button>
            )}
          </div>

          {/* Sisi Kanan: Switcher Tampilan (Desktop) & Urutkan */}
          <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
            {/* View Switcher: Tabel vs Tampilan Gede (Desktop) */}
            <div className="hidden sm:inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/70 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title={t("viewTable")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="size-3.5" />
                <span>{t("viewTable")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title={t("viewBigCards")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-[#0284C7] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>{t("viewBigCards")}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">{t("sortBy")}</span>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as "newest" | "price_asc" | "price_desc" | "popular");
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="newest">{t("sortRecentlyUpdated")}</option>
                <option value="price_asc">{t("sortPriceAsc")}</option>
                <option value="price_desc">{t("sortPriceDesc")}</option>
                <option value="popular">{t("sortPopular")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card matching mockup */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {viewMode === "grid" ? (
          /* Mode Grid: Card Properti yang Simpel & Bersih */
          <div className="p-4 sm:p-5">
            {paginatedProperties.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                {t("noPropertiesFound")}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paginatedProperties.map((prop) => {
                  const initials = getInitials(prop.agent.name);
                  const isSale = prop.listing_type === "sale";
                  const isDraft = prop.status === "draft";
                  const coverUrl = prop.cover_image?.url;
                  const publicUrl = prop.public_url || `/id/properties/${prop.slug}`;
                  const isStatusOpen = openStatusMenuId === prop.id;

                  return (
                    <div
                      key={prop.id}
                      className={`group flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-xs transition-all hover:border-slate-300 hover:shadow-md ${
                        isDraft ? "border-amber-300/80 ring-1 ring-amber-100" : "border-slate-200/90"
                      }`}
                    >
                      {/* 1. Foto Cover Bersih */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-slate-100 bg-slate-100 ring-1 ring-inset ring-slate-900/10">
                        {coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={prop.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Home className="size-10" />
                          </div>
                        )}

                        {/* Status Badge (Kiri Atas) */}
                        <div className="absolute top-3 left-3 z-10" data-popover-container>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setOpenStatusMenuId(isStatusOpen ? null : prop.id);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-md transition-all ${getStatusBadgeStyle(
                              prop.status,
                            )}`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${getStatusDotColor(prop.status)}`}
                            />
                            <span>{getStatusLabel(prop.status)}</span>
                            <ChevronDown className="size-3 opacity-60" />
                          </button>

                          {/* Status Popover */}
                          {isStatusOpen && (
                            <div className="absolute left-0 top-full mt-1.5 z-30 w-36 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5">
                              {(
                                prop.status === "draft"
                                  ? (["draft", "active", "inactive"] as PropertyStatus[])
                                  : isSale
                                    ? (["active", "draft", "sold", "inactive"] as PropertyStatus[])
                                    : (["active", "draft", "rented", "inactive"] as PropertyStatus[])
                              ).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateStatus(prop.id, st)}
                                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors hover:bg-slate-50 ${
                                    prop.status === st
                                      ? "font-bold text-sky-600 bg-sky-50/50"
                                      : "text-slate-700"
                                  }`}
                                >
                                  <span
                                    className={`size-1.5 rounded-full ${getStatusDotColor(st)}`}
                                  />
                                  <span>{getStatusLabel(st)}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Tag Transaksi (Kanan Atas) */}
                        <span
                          className={`absolute top-3 right-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                            isSale ? "bg-slate-900/80 text-white" : "bg-[#0284C7]/80 text-white"
                          }`}
                        >
                          {isSale ? t("forSale") : t("forRent")}
                        </span>
                      </div>

                      {/* 2. Isi Informasi Card Simpel */}
                      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 gap-3">
                        <div>
                          {/* Harga Listing Utama */}
                          <div className="font-display text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                            {formatPriceDisplay(prop.price, prop.listing_type, prop.rent_period)}
                          </div>

                          {/* Judul & Lokasi */}
                          {prop.status === "active" ? (
                            <NextLink
                              href={publicUrl}
                              className="mt-1 block font-bold text-sm text-slate-800 transition-colors hover:text-sky-600 line-clamp-1"
                            >
                              {prop.title}
                            </NextLink>
                          ) : (
                            <span className="mt-1 block font-bold text-sm text-slate-800 line-clamp-1">
                              {prop.title}
                            </span>
                          )}
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {prop.location.district ? `${prop.location.district}, ` : ""}
                              {prop.location.city.name}
                            </span>
                          </p>
                        </div>

                        {/* Spesifikasi Fisik 1 Baris Elegan */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                          {prop.bedrooms ? (
                            <span>
                              <strong className="font-bold text-slate-800">{prop.bedrooms}</strong> KT
                            </span>
                          ) : null}
                          {prop.bedrooms && prop.bathrooms ? (
                            <span className="text-slate-300">•</span>
                          ) : null}
                          {prop.bathrooms ? (
                            <span>
                              <strong className="font-bold text-slate-800">{prop.bathrooms}</strong> KM
                            </span>
                          ) : null}
                          {(prop.bedrooms || prop.bathrooms) && prop.land_area ? (
                            <span className="text-slate-300">•</span>
                          ) : null}
                          {prop.land_area ? (
                            <span>
                              LT <strong className="font-bold text-slate-800">{prop.land_area}</strong>m²
                            </span>
                          ) : null}
                          {prop.land_area && prop.building_area ? (
                            <span className="text-slate-300">•</span>
                          ) : null}
                          {prop.building_area ? (
                            <span>
                              LB <strong className="font-bold text-slate-800">{prop.building_area}</strong>m²
                            </span>
                          ) : null}
                        </div>

                        {/* 3. Footer Sederhana (Agen & Aksi Cepat) */}
                        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                          {/* Agen Penanggung Jawab */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-800 ring-1 ring-sky-200">
                              {initials}
                            </div>
                            <span className="truncate text-xs font-semibold text-slate-700">
                              {prop.agent.name}
                            </span>
                          </div>

                          {/* Tombol Aksi Ringkas */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isDraft ? (
                              <>
                                <NextLink
                                  href="/dashboard/properties/new"
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                >
                                  <Pencil className="size-3 text-amber-700" />
                                  <span>{t("continueEditDraft")}</span>
                                </NextLink>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(prop.id, "active")}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-emerald-700 shadow-2xs"
                                >
                                  <Rocket className="size-3" />
                                  <span>{t("publishNow")}</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {prop.status === "active" ? (
                                  <NextLink
                                    href={publicUrl}
                                    target="_blank"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                    title={t("actionViewWeb")}
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </NextLink>
                                ) : (
                                  <span
                                    className="cursor-not-allowed rounded-lg p-1.5 text-slate-300"
                                    title={`${t("actionViewWeb")} (${getStatusLabel(prop.status)})`}
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </span>
                                )}
                                <button
                                  type="button"
                                  data-popover-container
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setOpenStatusMenuId(isStatusOpen ? null : prop.id);
                                  }}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                  title={t("actionChangeStatus")}
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Table View matching mockup */
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <th scope="col" className="px-4 py-3.5 text-center">
                  {t("thPhoto")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thTitleSpecs")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thTypeMarket")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thPriceListing")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thAgentInCharge")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thStatus")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thPerformance")}
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  {t("thActions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedProperties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    Tidak ada listing yang sesuai dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedProperties.map((prop) => {
                  const initials = getInitials(prop.agent.name);
                  const isSale = prop.listing_type === "sale";
                  const isPrimary = prop.market_type === "primary";
                  const coverUrl = prop.cover_image?.url;
                  const publicUrl = prop.public_url || `/id/properties/${prop.slug}`;
                  const isStatusOpen = openStatusMenuId === prop.id;
                  const isActionOpen = openActionMenuId === prop.id;

                  return (
                    <tr key={prop.id} className="transition-colors hover:bg-slate-50/70">
                      {/* 1. FOTO */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="relative mx-auto size-12 sm:size-14 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                          {coverUrl ? (
                            <Image
                              src={coverUrl}
                              alt={prop.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <Home className="size-5" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. JUDUL & SPESIFIKASI */}
                      <td className="px-4 py-3.5 max-w-[280px]">
                        {prop.status === "active" ? (
                          <NextLink
                            href={publicUrl}
                            className="font-bold text-xs sm:text-sm text-slate-900 transition-colors hover:text-sky-600 line-clamp-1"
                          >
                            {prop.title}
                          </NextLink>
                        ) : (
                          <span className="block font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                            {prop.title}
                          </span>
                        )}
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {prop.property_type.name_id} • {prop.location.district || prop.location.city.name}
                          </span>
                        </p>
                      </td>

                      {/* 3. TIPE & PASAR */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isSale ? (
                          <span className="inline-block rounded-md bg-[#0F172A] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">
                            {t("forSale")}
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-[#0284C7] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">
                            {t("forRent")}
                          </span>
                        )}
                        <p
                          className={`mt-1 text-[11px] font-semibold ${
                            isPrimary ? "text-sky-600" : "text-slate-400"
                          }`}
                        >
                          {isPrimary ? t("marketPrimary") : t("marketSecondary")}
                        </p>
                      </td>

                      {/* 4. HARGA LISTING */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-display font-bold text-xs sm:text-sm text-slate-900">
                          {formatPriceDisplay(prop.price, prop.listing_type, prop.rent_period)}
                        </span>
                      </td>

                      {/* 5. AGEN PENANGGUNG JAWAB */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] sm:text-xs font-bold text-sky-800 ring-1 ring-sky-200">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900">{prop.agent.name}</p>
                            <p className="font-mono text-[10px] text-slate-400">{prop.agent.agent_code}</p>
                          </div>
                        </div>
                      </td>

                      {/* 6. STATUS (Interactive Dropdown Badge) */}
                      <td className="px-4 py-3.5 whitespace-nowrap relative">
                        <div className="relative inline-block text-left" data-popover-container>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setOpenStatusMenuId(isStatusOpen ? null : prop.id);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all hover:opacity-90 ${getStatusBadgeStyle(
                              prop.status,
                            )}`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${getStatusDotColor(prop.status)}`}
                            />
                            <span>{getStatusLabel(prop.status)}</span>
                            <ChevronDown className="size-3 text-slate-400" />
                          </button>

                          {/* Status Popup Options */}
                          {isStatusOpen && (
                            <div className="absolute left-0 top-full mt-1.5 z-30 w-36 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg ring-1 ring-black/5">
                              {(
                                prop.status === "draft"
                                  ? (["draft", "active", "inactive"] as PropertyStatus[])
                                  : isSale
                                    ? (["active", "draft", "sold", "inactive"] as PropertyStatus[])
                                    : (["active", "draft", "rented", "inactive"] as PropertyStatus[])
                              ).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateStatus(prop.id, st)}
                                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors hover:bg-slate-50 ${
                                    prop.status === st ? "font-bold text-sky-600 bg-sky-50/50" : "text-slate-700"
                                  }`}
                                >
                                  <span
                                    className={`size-1.5 rounded-full ${getStatusDotColor(st)}`}
                                  />
                                  <span>{getStatusLabel(st)}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 7. PERFORMA */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <Eye className="size-3.5 text-slate-400" />
                            <span>{prop.view_count.toLocaleString("id-ID")}x</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <MessageSquare className="size-3.5 text-emerald-500" />
                            <span>{prop.whatsapp_click_count} {t("waClicksText")}</span>
                          </div>
                        </div>
                      </td>

                      {/* 8. AKSI (Web, Edit, More) */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap relative">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1. View in Web (hanya aktif jika status active) */}
                          {prop.status === "active" ? (
                            <NextLink
                              href={publicUrl}
                              target="_blank"
                              title={t("actionViewWeb")}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <ExternalLink className="size-3.5" />
                            </NextLink>
                          ) : (
                            <span
                              title={`${t("actionViewWeb")} (${getStatusLabel(prop.status)})`}
                              className="cursor-not-allowed rounded-lg p-1.5 text-slate-300"
                            >
                              <ExternalLink className="size-3.5" />
                            </span>
                          )}

                          {/* 2. Edit */}
                          <button
                            type="button"
                            data-popover-container
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setOpenStatusMenuId(prop.id);
                            }}
                            title={t("actionEdit")}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="size-3.5" />
                          </button>

                          {/* 3. More Actions Menu */}
                          <div className="relative inline-block" data-popover-container>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenStatusMenuId(null);
                                setOpenActionMenuId(isActionOpen ? null : prop.id);
                              }}
                              title={t("thActions")}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <MoreVertical className="size-3.5" />
                            </button>

                            {isActionOpen && (
                              <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg ring-1 ring-black/5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setOpenStatusMenuId(prop.id);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil className="size-3.5 text-slate-400" />
                                  <span>{t("actionChangeStatus")}</span>
                                </button>
                                {user?.role === "admin" && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setOpenActionMenuId(null);
                                      if (confirm(`Hapus listing "${prop.title}"?`)) {
                                        try {
                                          await apiRequest(`/properties/${prop.id}`, {
                                            method: "DELETE",
                                          });
                                          setDbProperties((prev) =>
                                            prev.filter((p) => p.id !== prop.id),
                                          );
                                          setToast({ message: "Listing berhasil dihapus" });
                                          window.dispatchEvent(new CustomEvent("masterpro-summary-refresh"));
                                        } catch {
                                          setToast({ message: "Gagal menghapus listing", isError: true });
                                        }
                                      }
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="size-3.5 text-rose-500" />
                                    <span>{t("actionDelete")}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* Table Footer: Item Info & Pagination matching mockup */}
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">
            {t("showingPropertiesCount", {
              start: totalCount === 0 ? 0 : startIndex + 1,
              end: Math.min(startIndex + perPage, totalCount),
              total: totalCount,
            })}
          </p>

          {/* Numbered Pagination */}
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
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`size-7 rounded-lg text-xs font-bold transition-all ${
                    isActive
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
