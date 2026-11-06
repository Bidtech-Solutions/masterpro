"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PropertyDetailFacility } from "@/types/property";
import { cn } from "@/lib/utils";

interface Props {
  description: string;
  facilities?: PropertyDetailFacility[];
  locale?: string;
}

export function PropertyDescription({ description, facilities = [], locale = "id" }: Props) {
  const t = useTranslations("propertyDetail");
  const [expanded, setExpanded] = useState(false);

  // Poin keunggulan kawasan khas Batam Centre (sesuai referensi UI)
  const highlights = [
    "5 Menit ke Terminal Ferry Internasional Batam Centre (akses cepat ke Singapura & Malaysia)",
    "7 Menit menuju Mega Mall Batam Centre & Alun-Alun Engku Putri",
    "10 Menit ke Rumah Sakit Elisabeth Batam",
    "15 Menit ke Bandara Internasional Hang Nadim",
    "Lingkungan tertata asri & aman dengan sistem one-gate security cluster 24 jam",
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-4 font-display text-xl font-bold text-navy-900">{t("description")}</h2>

      {/* Kontainer Teks dengan Efek Gradien & Toggle */}
      <div className="relative">
        <div
          className={cn(
            "prose prose-slate max-w-none space-y-4 text-sm leading-relaxed text-slate-600 md:text-base",
            !expanded && "max-h-48 overflow-hidden",
          )}
        >
          {description.split("\n\n").map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}

          {/* Bagian Keunggulan Kawasan */}
          <div className="pt-2">
            <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-navy-900">
              <Sparkles className="size-4 text-blue-600" />
              {t("keyFeatures")}
            </h3>
            <ul className="not-prose space-y-2.5">
              {highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fasilitas Terdaftar (jika ada) */}
          {facilities.length > 0 && (
            <div className="not-prose pt-4">
              <h4 className="mb-2.5 text-sm font-bold text-navy-900">Fasilitas Unit</h4>
              <div className="flex flex-wrap gap-2">
                {facilities.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    <CheckCircle2 className="size-3.5 text-blue-600" />
                    {locale === "en" ? f.name_en : f.name_id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gradien Fade Out saat tertutup */}
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {/* Tombol Toggle */}
      <div className="mt-4 flex justify-start border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
        >
          {expanded ? (
            <>
              {t("readLess")} <ChevronUp className="size-4" />
            </>
          ) : (
            <>
              {t("readMore")} <ChevronDown className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
