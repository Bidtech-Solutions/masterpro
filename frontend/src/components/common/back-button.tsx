"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";

import { hasInAppHistory } from "@/components/common/navigation-tracker";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  /** Tujuan bila tidak ada riwayat di situs ini (mis. dibuka dari tautan WhatsApp). */
  fallbackHref: "/properties" | "/";
  className?: string;
}

/**
 * Tombol kembali: memakai riwayat browser bila pengunjung datang dari halaman lain di situs ini
 * (navigasi di dalam aplikasi, atau muat penuh dengan referrer dari domain yang sama),
 * selain itu menuju `fallbackHref`. Tetap berupa tautan sehingga berfungsi tanpa JavaScript.
 */
export function BackButton({ fallbackHref, className }: Props) {
  const t = useTranslations("common");
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    let sameOriginReferrer = false;
    try {
      sameOriginReferrer =
        document.referrer !== "" && new URL(document.referrer).origin === window.location.origin;
    } catch {
      sameOriginReferrer = false;
    }
    if ((hasInAppHistory() || sameOriginReferrer) && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  }

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy-900 shadow-2xs transition hover:border-blue-300 hover:text-blue-700 active:scale-95",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {t("back")}
    </Link>
  );
}
