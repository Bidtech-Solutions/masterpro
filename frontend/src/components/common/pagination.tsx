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
  const t = useTranslations("properties");
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

  return (
    <nav aria-label={label} className="mt-14 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {/* Tombol Sebelumnya */}
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600 sm:text-sm"
        >
          <ChevronLeft className="size-4" aria-hidden />
          <span>{t("paginationPrev")}</span>
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-300 sm:text-sm">
          <ChevronLeft className="size-4" aria-hidden />
          <span>{t("paginationPrev")}</span>
        </span>
      )}

      {/* Angka Halaman */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {pages.map((n, i) => (
          <span key={n} className="flex items-center gap-1.5 sm:gap-2">
            {i > 0 && n - (pages[i - 1] ?? n) > 1 ? (
              <span className="px-1 text-sm font-bold text-slate-400">…</span>
            ) : null}
            <Link
              href={hrefFor(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "flex size-9 items-center justify-center rounded-xl text-xs font-bold transition-all sm:size-10 sm:text-sm",
                n === page
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-600",
              )}
            >
              {n}
            </Link>
          </span>
        ))}
      </div>

      {/* Tombol Selanjutnya */}
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600 sm:text-sm"
        >
          <span>{t("paginationNext")}</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-300 sm:text-sm">
          <span>{t("paginationNext")}</span>
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
