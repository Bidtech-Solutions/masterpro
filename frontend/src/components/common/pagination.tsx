import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Paginasi bernomor ber-URL `?page=n` (PRD WEB-P-06). */
export function Pagination({
  page,
  totalPages,
  searchParams,
  label,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
  label: string;
}) {
  const t = useTranslations("common");
  const hrefFor = (n: number) => {
    const query: Record<string, string> = {};
    for (const [k, v] of Object.entries(searchParams)) {
      if (k !== "page" && typeof v === "string") query[k] = v;
    }
    if (n > 1) query.page = String(n);
    return { pathname: "/properties" as const, query };
  };
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );
  const base =
    "flex size-10 items-center justify-center rounded-full border text-body-sm font-semibold transition-colors";

  return (
    <nav aria-label={label} className="mt-12 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(base, "border-slate-200 hover:border-blue-600")}
          aria-label={t("previous")}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : null}
      {pages.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - (pages[i - 1] ?? n) > 1 ? <span className="text-slate-400">…</span> : null}
          <Link
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              base,
              n === page
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 hover:border-blue-600",
            )}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(base, "border-slate-200 hover:border-blue-600")}
          aria-label={t("next")}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
