"use client";

import { useContext } from "react";

import { AuthContext } from "@/providers/auth-provider";

/** Akses pengguna login di dalam /dashboard/(protected). */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
