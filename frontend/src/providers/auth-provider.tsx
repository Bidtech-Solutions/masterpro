"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { apiRequest, notifyAuthChange, subscribeAuthChange } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

/** Memuat pengguna saat ini (GET /auth/me) dan mengarahkan ke login bila sesi tidak valid (AUTH-06). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    () =>
      apiRequest<User>("/auth/me").then(
        (u) => {
          setUser(u);
          setLoading(false);
        },
        (err: unknown) => {
          setLoading(false);
          if (isApiError(err) && err.status === 401) {
            setUser(null);
            router.replace(`/dashboard/login?next=${encodeURIComponent(pathname)}&expired=1`);
            return;
          }
          throw err;
        },
      ),
    [pathname, router],
  );

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && user?.role === "agent") {
      if (pathname.startsWith("/dashboard/users") || pathname.startsWith("/dashboard/agents")) {
        router.replace("/dashboard");
      }
    }
  }, [loading, pathname, router, user]);

  useEffect(() => {
    const unsubscribe = subscribeAuthChange((event) => {
      if (event === "LOGOUT") {
        setUser(null);
        router.replace("/dashboard/login");
      } else if (event === "LOGIN") {
        void reload();
      }
    });

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        void reload();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [reload, router]);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      notifyAuthChange("LOGOUT");
      router.replace("/dashboard/login");
    }
  }, [router]);

  const value = useMemo(() => ({ user, loading, logout, reload }), [user, loading, logout, reload]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
