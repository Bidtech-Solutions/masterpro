import Script from "next/script";

import { site } from "@/config/site";

/** Google Analytics 4 (gtag.js). Hanya website publik; nonaktif bila NEXT_PUBLIC_GA_ID kosong. */
export function GoogleAnalytics() {
  const id = site.gaId;
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(id)});`}
      </Script>
    </>
  );
}
