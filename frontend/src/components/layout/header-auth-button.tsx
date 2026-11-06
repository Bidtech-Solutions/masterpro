"use client";

import { ChevronDown, LayoutDashboard, LogIn, LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { apiRequest, notifyAuthChange, subscribeAuthChange } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

interface HeaderAuthButtonProps {
  initialLoggedIn?: boolean;
}

/**
 * Tombol otentikasi di navbar header.
 * Menampilkan tombol "Masuk" jika pengguna belum login, atau
 * menu profil & tautan dashboard jika pengguna telah login.
 */
export function HeaderAuthButton({ initialLoggedIn = false }: HeaderAuthButtonProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Muat data profil pengguna bila ada sesi
  useEffect(() => {
    let mounted = true;

    async function fetchUserData() {
      try {
        const u = await apiRequest<User>("/auth/me");
        if (mounted && u) {
          setUser(u);
          setIsLoggedIn(true);
        }
      } catch (err: unknown) {
        if (mounted) {
          if (isApiError(err) && err.status === 401) {
            setUser(null);
            setIsLoggedIn(false);
          }
        }
      }
    }

    if (initialLoggedIn || typeof document !== "undefined" && document.cookie.includes("mp_access")) {
      void fetchUserData();
    }

    // Dengarkan event sinkronisasi tab (login / logout)
    const unsubscribe = subscribeAuthChange((event) => {
      if (event === "LOGOUT") {
        setUser(null);
        setIsLoggedIn(false);
        setMenuOpen(false);
      } else if (event === "LOGIN") {
        void fetchUserData();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [initialLoggedIn]);

  // Tutup dropdown bila klik di luar atau tekan Escape
  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Abaikan bila request jaringan gagal, tetap bersihkan state lokal
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      setMenuOpen(false);
      notifyAuthChange("LOGOUT");
      router.refresh();
    }
  };

  // State: Belum Login -> Tampilkan tombol "Masuk"
  if (!isLoggedIn) {
    return (
      <NextLink
        href="/dashboard/login"
        prefetch={false}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 font-display text-body-sm font-bold text-white shadow-card transition-all hover:bg-blue-700 hover:shadow-card-hover active:scale-95"
      >
        <LogIn className="size-4" aria-hidden />
        {t("login")}
      </NextLink>
    );
  }

  // State: Sudah Login -> Tampilkan chip profil pengguna dengan popover
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const roleLabel = user?.role === "admin" ? "Super Admin" : "Mitra Agen";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={user?.name ? t("welcomeUser", { name: user.name }) : t("dashboard")}
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3.5 text-left transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2",
          menuOpen && "border-blue-600 ring-2 ring-blue-600/20",
        )}
      >
        {/* Avatar atau Inisial */}
        <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-display text-xs font-bold text-blue-700 ring-1 ring-blue-200">
          {user?.avatar_url ? (
            <Image src={user.avatar_url} alt={user.name} fill sizes="32px" className="object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Info Nama & Peran (Layar sm+) */}
        <div className="hidden flex-col sm:flex">
          <span className="max-w-[130px] truncate text-xs font-bold text-navy-900 leading-snug">
            {user?.name || t("dashboard")}
          </span>
          <span className="text-[10px] font-medium text-slate-500 leading-none">
            {roleLabel}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "size-3.5 text-slate-400 transition-transform duration-200",
            menuOpen && "rotate-180 text-blue-600",
          )}
          aria-hidden
        />
      </button>

      {/* Popover Menu Pengguna */}
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all z-50 animate-in fade-in zoom-in-95"
        >
          {/* Header Info Akun */}
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="truncate text-xs font-bold text-navy-900">{user?.name || "Pengguna"}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.email || ""}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Navigasi Utama Pengguna */}
          <div className="py-1">
            <NextLink
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-navy-900"
            >
              <LayoutDashboard className="size-4 text-slate-500" aria-hidden />
              {t("dashboard")}
            </NextLink>

            <NextLink
              href="/dashboard/account"
              onClick={() => setMenuOpen(false)}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-navy-900"
            >
              <UserIcon className="size-4 text-slate-500" aria-hidden />
              {t("myProfile")}
            </NextLink>
          </div>

          {/* Opsi Keluar */}
          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={() => void handleLogout()}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="size-4 text-rose-500" aria-hidden />
              {t("signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

