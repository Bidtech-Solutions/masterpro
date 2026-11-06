"use client";

import { LayoutDashboard, LogIn, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";

import { apiRequest, notifyAuthChange, subscribeAuthChange } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { User } from "@/types/user";

import { LocaleSwitcher } from "./locale-switcher";
import { NavLinks } from "./nav-links";

interface MobileMenuProps {
  initialLoggedIn?: boolean;
}

/** Menu hamburger untuk layar < md (PRD WEB-G-01). */
export function MobileMenu({ initialLoggedIn = false }: MobileMenuProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [user, setUser] = useState<User | null>(null);

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

    if (initialLoggedIn || (typeof document !== "undefined" && document.cookie.includes("mp_access"))) {
      void fetchUserData();
    }

    const unsubscribe = subscribeAuthChange((event) => {
      if (event === "LOGOUT") {
        setUser(null);
        setIsLoggedIn(false);
      } else if (event === "LOGIN") {
        void fetchUserData();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [initialLoggedIn]);

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

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Abaikan bila request jaringan gagal
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      setOpen(false);
      notifyAuthChange("LOGOUT");
      router.refresh();
    }
  };

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
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col gap-5 overflow-y-auto bg-white p-6 shadow-popover">
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

            {/* Bagian Akun / Tombol Masuk di Bawah Menu Mobile */}
            <div className="mt-auto border-t border-slate-100 pt-5">
              {isLoggedIn ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-display text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                      {user?.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-navy-900">{user?.name || "Pengguna"}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span className="truncate">{roleLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <NextLink
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 font-display text-body-sm font-bold text-white shadow-card transition-all hover:bg-blue-700"
                    >
                      <LayoutDashboard className="size-4" aria-hidden />
                      {t("dashboard")}
                    </NextLink>

                    <NextLink
                      href="/dashboard/account"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-body-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <UserIcon className="size-4 text-slate-500" aria-hidden />
                      {t("myProfile")}
                    </NextLink>

                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-body-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="size-4 text-rose-500" aria-hidden />
                      {t("signOut")}
                    </button>
                  </div>
                </div>
              ) : (
                <NextLink
                  href="/dashboard/login"
                  onClick={() => setOpen(false)}
                  prefetch={false}
                  className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 font-display text-body-sm font-bold text-white shadow-card transition-all hover:bg-blue-700 active:scale-95"
                >
                  <LogIn className="size-4" aria-hidden />
                  {t("login")}
                </NextLink>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
