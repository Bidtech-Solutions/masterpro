"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

/** Batas error halaman publik (mis. API tidak dapat dihubungi). */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="mb-3 font-display text-h1 font-bold text-navy-900">{t("errorTitle")}</h1>
      <p className="mb-8 max-w-md text-body text-slate-500">{t("errorDescription")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-blue-600 px-5 py-3 font-display text-body-sm font-bold text-white hover:bg-blue-700"
      >
        {t("retry")}
      </button>
    </div>
  );
}
