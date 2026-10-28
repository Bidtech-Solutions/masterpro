"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { apiRequest } from "@/lib/api/client";
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
            router.replace(`/dashboard/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
          throw err;
        },
      ),
    [pathname, router],
  );

  useEffect(() => {
    void reload();
    // hanya saat mount; navigasi antar halaman dashboard tidak perlu memuat ulang /auth/me
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.replace("/dashboard/login");
    }
  }, [router]);

  const value = useMemo(() => ({ user, loading, logout, reload }), [user, loading, logout, reload]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
