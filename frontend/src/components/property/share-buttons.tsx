"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { whatsappShareUrl } from "@/lib/whatsapp";

const noopSubscribe = () => () => {};
const detectNativeShare = () => typeof navigator.share === "function";
const serverNativeShare = () => false;

interface Props {
  /** Pesan lengkap untuk WhatsApp / Web Share (PRD §7.6 "Bagikan listing"). */
  message: string;
  title: string;
  url: string;
}

/** Tombol bagikan listing: WhatsApp, salin tautan, dan Web Share API bila tersedia (PRD WEB-D-09). */
export function ShareButtons({ message, title, url }: Props) {
  const t = useTranslations("propertyDetail");
  const [copied, setCopied] = useState(false);
  // Server merender tanpa tombol "Lainnya"; klien menambahkannya setelah hidrasi bila didukung.
  const canNativeShare = useSyncExternalStore(noopSubscribe, detectNativeShare, serverNativeShare);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard ditolak (mis. konteks tidak aman) — biarkan pengguna menyalin dari bilah alamat.
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: message });
    } catch {
      // Pengguna membatalkan dialog bagikan.
    }
  }

  const buttonClass =
    "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-navy-900 transition hover:border-blue-300 hover:text-blue-700";

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">{t("shareTitle")}</p>
      <div className="flex flex-wrap gap-2">
        <a href={whatsappShareUrl(message)} target="_blank" rel="noopener noreferrer" className={buttonClass}>
          <Share2 className="size-3.5 text-emerald-600" aria-hidden />
          {t("shareWhatsapp")}
        </a>
        <button type="button" onClick={copyLink} className={buttonClass} aria-live="polite">
          {copied ? (
            <Check className="size-3.5 text-emerald-600" aria-hidden />
          ) : (
            <Link2 className="size-3.5" aria-hidden />
          )}
          {copied ? t("shareCopied") : t("shareCopy")}
        </button>
        {canNativeShare && (
          <button type="button" onClick={nativeShare} className={buttonClass}>
            <Share2 className="size-3.5" aria-hidden />
            {t("shareMore")}
          </button>
        )}
      </div>
    </div>
  );
}
