import { Banknote, Building2, GraduationCap, Landmark, LayoutDashboard, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export function AgentBenefits() {
  const t = useTranslations("joinAgent");

  const benefits = [
    {
      icon: Banknote,
      title: t("benefit1Title"),
      desc: t("benefit1Desc"),
    },
    {
      icon: Building2,
      title: t("benefit2Title"),
      desc: t("benefit2Desc"),
    },
    {
      icon: Users,
      title: t("benefit3Title"),
      desc: t("benefit3Desc"),
    },
    {
      icon: GraduationCap,
      title: t("benefit4Title"),
      desc: t("benefit4Desc"),
    },
    {
      icon: LayoutDashboard,
      title: t("benefit5Title"),
      desc: t("benefit5Desc"),
    },
    {
      icon: Landmark,
      title: t("benefit6Title"),
      desc: t("benefit6Desc"),
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container-page">
        {/* Header Bagian */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 md:text-3xl lg:text-4xl">
            {t("benefitsSectionTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            {t("benefitsSectionSubtitle")}
          </p>
        </div>

        {/* Grid 6 Kartu Keuntungan */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-card-hover"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-navy-900">{b.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
