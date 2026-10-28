import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** 404 bilingual (PRD WEB-G-06). */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="mb-2 font-display text-display font-extrabold text-blue-600">404</p>
      <h1 className="mb-3 font-display text-h1 font-bold text-navy-900">{t("title")}</h1>
      <p className="mb-8 max-w-md text-body text-slate-500">{t("description")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-blue-600 px-5 py-3 font-display text-body-sm font-bold text-white hover:bg-blue-700"
        >
          {t("backHome")}
        </Link>
        <Link
          href="/properties"
          className="rounded-md border border-slate-300 px-5 py-3 font-display text-body-sm font-bold text-navy-800 hover:border-blue-600"
        >
          {t("browse")}
        </Link>
      </div>
    </div>
  );
}
