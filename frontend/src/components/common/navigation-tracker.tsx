"use client";

import { useEffect } from "react";

import { usePathname } from "@/i18n/navigation";

// State modul: bertahan selama navigasi sisi klien, otomatis reset saat halaman dimuat ulang.
let visitedPages = 0;

/** True bila pengunjung sudah membuka halaman lain di situs ini dalam sesi tab yang sama. */
export function hasInAppHistory(): boolean {
  return visitedPages > 1;
}

/** Menghitung perpindahan halaman di dalam situs (dipakai BackButton). Dipasang sekali di layout. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    visitedPages += 1;
  }, [pathname]);
  return null;
}
