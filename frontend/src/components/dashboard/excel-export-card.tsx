"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Filter, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { downloadPropertiesExcel } from "@/lib/api/export";

interface ExcelExportCardProps {
  onExport?: () => void;
  onCustomizeFilter?: () => void;
}

export function ExcelExportCard({ onExport, onCustomizeFilter }: ExcelExportCardProps) {
  const t = useTranslations("dashboard");
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleDownload = async () => {
    if (onExport) {
      onExport();
      return;
    }

    try {
      setIsExporting(true);
      setFeedback(null);
      await downloadPropertiesExcel();
      setFeedback({
        type: "success",
        message: "Laporan resmi Excel properti (.xlsx) berhasil diunduh!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal mengunduh laporan Excel",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs md:flex-row md:items-center">
      {/* Icon + Title + Description */}
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <FileSpreadsheet className="size-6" aria-hidden />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">{t("excelTitle")}</h2>
          <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-slate-500">{t("excelDesc")}</p>

          {feedback && (
            <div
              className={`mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              ) : (
                <XCircle className="size-3.5 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex shrink-0 items-center gap-2.5 self-start md:self-center">
        <button
          type="button"
          onClick={onCustomizeFilter}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <Filter className="size-3.5 text-slate-500" aria-hidden />
          <span>{t("customizeFilter")}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#047857] active:bg-[#065F46] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? (
            <Loader2 className="size-3.5 animate-spin text-white" aria-hidden />
          ) : (
            <Download className="size-3.5 text-white" aria-hidden />
          )}
          <span>{isExporting ? "Mengunduh..." : t("downloadExcel")}</span>
        </button>
      </div>
    </div>
  );
}
