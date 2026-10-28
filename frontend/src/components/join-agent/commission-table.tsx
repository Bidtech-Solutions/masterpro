import { useTranslations } from "next-intl";

import { SectionHeading } from "@/components/common/section-heading";
import { commissionSplit, rentCommissionTiers, saleCommissionTiers } from "@/config/commission";

/** Tabel struktur & pembagian komisi (PRD WEB-A-03, §7.8; DESIGN.md §6.7). */
export function CommissionTable() {
  const t = useTranslations("joinAgent");
  const fmt = (n: number) => `${n.toLocaleString("id-ID")}%`;

  const tables = [
    { title: t("saleCommission"), rows: saleCommissionTiers },
    { title: t("rentCommission"), rows: rentCommissionTiers },
  ];

  return (
    <section className="py-16 md:py-20" id="komisi">
      <div className="container-page">
        <SectionHeading title={t("commissionTitle")} className="mb-10" />
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          {tables.map((tbl) => (
            <div
              key={tbl.title}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card"
            >
              <table className="w-full text-left">
                <caption className="bg-navy-800 px-5 py-3 text-left font-display text-body font-bold text-white">
                  {tbl.title}
                </caption>
                <thead className="bg-slate-50 text-caption tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3">
                      {t("priceRange")}
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      {t("commission")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tbl.rows.map((row) => (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-5 py-4 text-body-sm text-slate-700">{t(`tier.${row.key}`)}</td>
                      <td className="px-5 py-4 text-right font-display text-h3 font-extrabold text-blue-600">
                        {fmt(row.percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <h3 className="mb-6 font-display text-h3 font-bold text-navy-900">{t("splitTitle")}</h3>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {commissionSplit.map((s) => (
            <li key={s.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
              <p className="font-display text-price-lg font-extrabold text-blue-600">{fmt(s.percent)}</p>
              <p className="mb-3 font-display text-body font-bold text-navy-900">{t(`role.${s.key}`)}</p>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-blue-50" aria-hidden>
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${s.percent}%` }} />
              </div>
              <p className="text-caption text-slate-500">{t(`roleDesc.${s.key}`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
