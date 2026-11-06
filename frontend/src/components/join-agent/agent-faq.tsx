"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Clock, HelpCircle, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

export function AgentFaq() {
  const t = useTranslations("joinAgent");

  // Default item pertama terbuka seperti di gambar referensi
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      icon: HelpCircle,
      question: t("faq1Question"),
      answer: t("faq1Answer"),
    },
    {
      icon: Clock,
      question: t("faq2Question"),
      answer: t("faq2Answer"),
    },
    {
      icon: Wallet,
      question: t("faq3Question"),
      answer: t("faq3Answer"),
    },
    {
      icon: CheckCircle2,
      question: t("faq4Question"),
      answer: t("faq4Answer"),
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container-page">
        {/* Header Bagian */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 md:text-3xl lg:text-4xl">
            {t("faqSectionTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            {t("faqSectionSubtitle")}
          </p>
        </div>

        {/* Daftar Accordion FAQ dengan Animasi Interaktif */}
        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const Icon = faq.icon;
            const questionId = `faq-question-${idx}`;
            const answerId = `faq-answer-${idx}`;

            return (
              <div
                key={idx}
                className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ease-out ${
                  isOpen
                    ? "border-blue-300/80 shadow-md ring-4 ring-blue-500/5"
                    : "border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <button
                  type="button"
                  id={questionId}
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.995] md:p-6"
                >
                  <div className="flex items-center gap-3.5 md:gap-4">
                    {/* Badge Ikon dengan transisi visual saat aktif */}
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out md:size-11 ${
                        isOpen
                          ? "scale-105 bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                          : "scale-100 bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                      }`}
                    >
                      <Icon className="size-5 md:size-5.5" />
                    </div>

                    {/* Judul Pertanyaan */}
                    <span
                      className={`font-display text-sm font-bold transition-colors duration-200 md:text-base ${
                        isOpen ? "text-blue-700" : "text-navy-900"
                      }`}
                    >
                      {faq.question}
                    </span>
                  </div>

                  {/* Tombol Chevron dengan animasi rotasi & elastic easing */}
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isOpen
                        ? "rotate-180 bg-blue-50 text-blue-600"
                        : "rotate-0 bg-slate-100/70 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    }`}
                  >
                    <ChevronDown className="size-4" />
                  </div>
                </button>

                {/* Konten Jawaban dengan Animasi CSS Grid Height Expand/Collapse */}
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-slate-100/80 bg-slate-50/40 px-5 pt-3 pb-5 pl-14 text-sm leading-relaxed text-slate-600 md:px-6 md:pb-6 md:pl-16 md:text-base">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
