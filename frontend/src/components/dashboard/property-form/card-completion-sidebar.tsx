"use client";

import { CheckCircle2, Navigation, Save } from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

export interface CompletionItem {
  id: string;
  label: string;
  isComplete: boolean;
  isOptional?: boolean;
}

interface CardCompletionSidebarProps {
  items: CompletionItem[];
  percent: number;
  onPublish: () => void;
  onSaveDraft?: () => void;
  isPublishing?: boolean;
  isSavingDraft?: boolean;
}

export function CardCompletionSidebar({
  items,
  percent,
  onPublish,
  onSaveDraft,
  isPublishing = false,
  isSavingDraft = false,
}: CardCompletionSidebarProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="sticky top-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      {/* Header & Percentage */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold tracking-wider text-slate-800 uppercase">
          {t("dataCompletion")}
        </h3>
        <span className="text-xs font-bold text-sky-700">{t("dataCompletionPercent", { percent })}</span>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#0284C7] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Checklist items */}
      <ul className="mt-4 space-y-2.5 text-xs">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            {item.isComplete ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden />
            ) : (
              <span className="mt-0.5 size-3.5 shrink-0 rounded-xs border border-slate-300 bg-white" />
            )}
            <span
              className={`leading-snug ${item.isComplete ? "font-medium text-slate-700" : "text-slate-400"}`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Action Buttons */}
      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing || isSavingDraft}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] active:scale-[0.98] disabled:opacity-50 sm:text-sm"
        >
          <Navigation className="size-4 rotate-45 text-white" aria-hidden />
          <span>{isPublishing ? "Memproses..." : t("publishListing")}</span>
        </button>

        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isPublishing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 sm:text-sm"
          >
            <Save className="size-3.5 text-slate-500" />
            <span>{isSavingDraft ? t("savingDraft") : t("saveDraft")}</span>
          </button>
        )}

        <NextLink
          href="/dashboard/properties"
          className="mt-3 block text-center text-xs font-semibold text-rose-500 transition-colors hover:text-rose-600 hover:underline"
        >
          {t("cancelAndDiscard")}
        </NextLink>
      </div>
    </div>
  );
}
