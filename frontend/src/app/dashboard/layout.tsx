import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import "@/styles/globals.css";

import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { default: "Dashboard MasterPro", template: "%s | Dashboard MasterPro" },
  robots: { index: false, follow: false },
};

/** Root layout dashboard — bahasa Indonesia, tidak diindeks (PRD §6). */
export default async function DashboardRootLayout({ children }: LayoutProps<"/dashboard">) {
  const messages = await getMessages();
  return (
    <html lang="id" className={fontVariables}>
      <body className="min-h-dvh bg-slate-50">
        <NextIntlClientProvider locale="id" messages={{ dashboard: messages.dashboard }}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
