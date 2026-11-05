import { useTranslations } from "next-intl";

import { rentCommissionTiers, saleCommissionTiers } from "@/config/commission";

export function AgentCommission() {
  const t = useTranslations("joinAgent");

  // Format angka dengan 1 desimal persis seperti mockup (3,0%, 2,5%, dsb)
  const fmt = (n: number) =>
    `${n.toLocaleString("id-ID", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;

  return (
    <section className="bg-white py-16 md:py-24" id="komisi">
      <div className="container-page">
        {/* Header Bagian */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 md:text-3xl lg:text-4xl">
            {t("commissionTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            {t("commissionSubtitle")}
          </p>
        </div>

        {/* 2 Kartu Komisi Berdampingan (1:1 Sesuai Mockup) */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Kartu 1: Komisi Penjualan Unit */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-shadow hover:shadow-card-hover">
            {/* Header Navy Gelap */}
            <div className="flex items-center justify-between bg-navy-950 px-6 py-4.5 text-white">
              <div className="flex items-center gap-3">
                <HouseHandIcon className="size-5 shrink-0 text-sky-400" />
                <h3 className="font-display text-base font-bold text-white md:text-lg">
                  {t("saleCommission")}
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-[#081B33] px-3 py-1 text-xs font-semibold text-slate-300">
                {t("saleCommissionBadge")}
              </span>
            </div>

            {/* Subheader Tabel */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-2.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <span>{t("commissionTableHeaderRange")}</span>
              <span>{t("commissionTableHeaderRate")}</span>
            </div>

            {/* Baris Tabel */}
            <div className="divide-y divide-slate-100 px-6">
              {saleCommissionTiers.map((tier) => (
                <div key={tier.key} className="flex items-center justify-between py-4 text-sm">
                  <span className="font-semibold text-navy-900 md:text-[15px]">{t(`tier.${tier.key}`)}</span>
                  <span className="font-display text-base font-extrabold text-blue-600 md:text-[17px]">
                    {fmt(tier.percent)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footnote */}
            <div className="mt-auto border-t border-slate-100 bg-slate-50/40 px-6 py-3.5 text-xs text-slate-500">
              {t("saleCommissionFootnote")}
            </div>
          </div>

          {/* Kartu 2: Komisi Penyewaan Unit */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-shadow hover:shadow-card-hover">
            {/* Header Navy Gelap */}
            <div className="flex items-center justify-between bg-navy-950 px-6 py-4.5 text-white">
              <div className="flex items-center gap-3">
                <HorizontalKeyIcon className="size-5 shrink-0 text-sky-400" />
                <h3 className="font-display text-base font-bold text-white md:text-lg">
                  {t("rentCommission")}
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-[#081B33] px-3 py-1 text-xs font-semibold text-slate-300">
                {t("rentCommissionBadge")}
              </span>
            </div>

            {/* Subheader Tabel */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-2.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <span>{t("commissionTableHeaderRentRange")}</span>
              <span>{t("commissionTableHeaderRate")}</span>
            </div>

            {/* Baris Tabel */}
            <div className="divide-y divide-slate-100 px-6">
              {rentCommissionTiers.map((tier) => (
                <div key={tier.key} className="flex items-center justify-between py-4 text-sm">
                  <span className="font-semibold text-navy-900 md:text-[15px]">{t(`tier.${tier.key}`)}</span>
                  <span className="font-display text-base font-extrabold text-blue-600 md:text-[17px]">
                    {fmt(tier.percent)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footnote */}
            <div className="mt-auto border-t border-slate-100 bg-slate-50/40 px-6 py-3.5 text-xs text-slate-500">
              {t("rentCommissionFootnote")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Ikon tangan memegang rumah khas properti sales */
function HouseHandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 3l6 4.5v3" />
      <path d="M6 6.8L11 3" />
      <path d="M10 8h2" />
      <path d="M10 10.5h2" />
      <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3" />
      <path d="M7 16h8a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5H7" />
    </svg>
  );
}

/** Ikon kunci horizontal sewa properti */
function HorizontalKeyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="7.5" cy="12" r="4.5" />
      <path d="M12 12h9" />
      <path d="M17 12v3" />
      <path d="M20 12v2" />
    </svg>
  );
}
