"use client";

import { ArrowRight, Eye, Home } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import type { TopViewedProperty } from "@/types/dashboard";

interface TopViewedPropertiesProps {
  properties?: TopViewedProperty[];
}

export function TopViewedProperties({ properties = [] }: TopViewedPropertiesProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      {/* Table Header Row */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Eye className="size-4" aria-hidden />
          </div>
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">{t("topViewedTitle")}</h2>
        </div>

        <NextLink
          href="/dashboard/properties"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          <span>{t("viewCatalog")}</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </NextLink>
      </div>

      {/* Table Content */}
      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-xs text-slate-500">
          {t("noTopViewedProperties")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  {t("thProperty")}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {t("thTypeCity")}
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold sm:text-right">
                  {t("thViews")}
                </th>
                <th scope="col" className="py-3 pl-4 text-right font-semibold">
                  {t("thWaClicks")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {properties.map((prop) => {
                const formattedViews = `${prop.view_count.toLocaleString("id-ID")}x`;
                const formattedWa = `${prop.whatsapp_click_count} WA`;

                return (
                  <tr key={prop.id || prop.code} className="transition-colors hover:bg-slate-50/70">
                    {/* Property Column: Image + Title + Code */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                          {prop.cover_image_url ? (
                            <Image
                              src={prop.cover_image_url}
                              alt={prop.title}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Home className="size-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                            {prop.title}
                          </p>
                          <p className="font-mono text-[11px] font-semibold text-blue-600">{prop.code}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type / City Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-semibold text-slate-800 capitalize">{prop.property_type}</p>
                      <p className="text-[11px] text-slate-500">
                        {prop.district ? `${prop.district}, ${prop.city_name}` : prop.city_name}
                      </p>
                    </td>

                    {/* Views Column */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap sm:text-right">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {formattedViews}
                      </span>
                    </td>

                    {/* WA Clicks Column */}
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/70">
                        {formattedWa}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
