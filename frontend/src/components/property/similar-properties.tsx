import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { PropertyCard as PropertyCardData } from "@/types/property";

import { PropertyCard } from "./property-card";

interface Props {
  properties: PropertyCardData[];
  cityName: string;
  locale: Locale;
}

export function SimilarProperties({ properties, cityName, locale }: Props) {
  const t = useTranslations("propertyDetail");

  if (!properties || properties.length === 0) return null;

  return (
    <section className="mt-16 md:mt-20">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-navy-900 md:text-3xl">
            {t("similarTitle", { city: cityName })}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">{t("similarSubtitle")}</p>
        </div>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 transition-colors hover:text-blue-700"
        >
          <span>{t("similarSeeAll")}</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {properties.slice(0, 3).map((prop) => (
          <PropertyCard key={prop.id} property={prop} locale={locale} variant="compact" />
        ))}
      </div>
    </section>
  );
}
