"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";

import { LocaleSwitcher } from "./locale-switcher";
import { NavLinks } from "./nav-links";

/** Menu hamburger untuk layar < md (PRD WEB-G-01). */
export function MobileMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-md text-navy-900 hover:bg-slate-100"
      >
        <Menu className="size-6" aria-hidden />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/50"
            aria-label={t("closeMenu")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col gap-6 bg-white p-6 shadow-popover">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("closeMenu")}
              className="flex size-11 items-center justify-center self-end rounded-md text-navy-900 hover:bg-slate-100"
            >
              <X className="size-6" aria-hidden />
            </button>
            <nav>
              <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />
            </nav>
            <Suspense>
              <LocaleSwitcher className="self-start" />
            </Suspense>
          </div>
        </div>
      ) : null}
    </div>
  );
}
