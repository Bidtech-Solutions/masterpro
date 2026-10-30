import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/common/json-ld";
import { SectionHeading } from "@/components/common/section-heading";
import { faqJsonLd } from "@/lib/seo";

const WHY = [1, 2, 3] as const;
const FAQ = [1, 2, 3, 4, 5] as const;

/** Blok teks editorial + FAQ Beranda untuk konten & keyword SEO (PRD §9.3–9.4). */
export async function SeoContent() {
  const t = await getTranslations("home.seoContent");
  const faq = FAQ.map((n) => ({ question: t(`faq${n}Q`), answer: t(`faq${n}A`) }));

  return (
    <section className="bg-slate-50 py-16">
      <div className="container-page max-w-4xl">
        <SectionHeading title={t("introTitle")} className="mb-6" />
        <p className="mb-4 text-body leading-relaxed text-slate-700">{t("introP1")}</p>
        <p className="mb-12 text-body leading-relaxed text-slate-700">{t("introP2")}</p>

        <SectionHeading title={t("whyTitle")} className="mb-6" />
        <ul className="mb-12 grid gap-6 md:grid-cols-3">
          {WHY.map((n) => (
            <li key={n} className="rounded-lg bg-white p-6 shadow-card">
              <h3 className="mb-2 font-display text-h3 font-bold text-navy-900">{t(`why${n}Title`)}</h3>
              <p className="text-body-sm leading-relaxed text-slate-600">{t(`why${n}Text`)}</p>
            </li>
          ))}
        </ul>

        <SectionHeading title={t("areaTitle")} className="mb-6" />
        <p className="mb-12 text-body leading-relaxed text-slate-700">{t("areaText")}</p>

        <SectionHeading title={t("faqTitle")} className="mb-6" />
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {faq.map((f) => (
            <details key={f.question} className="group px-6 py-4">
              <summary className="cursor-pointer list-none font-display text-body font-bold text-navy-900 marker:content-none">
                {f.question}
              </summary>
              <p className="mt-3 text-body-sm leading-relaxed text-slate-600">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd data={faqJsonLd(faq)} />
    </section>
  );
}
