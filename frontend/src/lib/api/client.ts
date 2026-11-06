"use client";

import type { ApiResponse } from "@/types/api";

import { ApiError } from "./errors";

/**
 * Klien API untuk browser (dashboard). Sesi memakai cookie HttpOnly (API.md §2):
 * - selalu `credentials: "include"` + header `X-Requested-With` (CSRF, API.md §2.2)
 * - 401 TOKEN_EXPIRED → satu kali POST /auth/refresh (single-flight) lalu ulangi request
 */

const BASE = "/api/v1";
const AUTH_CHANNEL = "mp_auth_sync";

export type AuthSyncEvent = "LOGIN" | "LOGOUT";

/** Mengirim sinyal perubahan status autentikasi ke seluruh tab di browser yang sama. */
export function notifyAuthChange(event: AuthSyncEvent): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const ch = new BroadcastChannel(AUTH_CHANNEL);
    ch.postMessage(event);
    ch.close();
  } catch {
    // Abaikan bila BroadcastChannel tidak didukung
  }
}

/** Mendengarkan perubahan status autentikasi dari tab lain di browser yang sama. */
export function subscribeAuthChange(listener: (event: AuthSyncEvent) => void): () => void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return () => {};
  try {
    const ch = new BroadcastChannel(AUTH_CHANNEL);
    ch.onmessage = (e: MessageEvent<AuthSyncEvent>) => {
      if (e.data === "LOGIN" || e.data === "LOGOUT") {
        listener(e.data);
      }
    };
    return () => ch.close();
  } catch {
    return () => {};
  }
}

let refreshing: Promise<boolean> | null = null;

/** Memperbarui sesi. Mengembalikan false bila sesi benar-benar tidak valid. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Internal: cegah loop refresh. */
  retried?: boolean;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    credentials: "include",
    signal: opts.signal,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(opts.body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
  });

  if (res.status === 204 || res.status === 202) return undefined as T;
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (res.ok && body?.success) return body.data;

  const error = body && !body.success ? body.error : { code: "INTERNAL_ERROR", message: res.statusText };
  if (res.status === 401 && error.code === "TOKEN_EXPIRED" && !opts.retried && (await refreshSession())) {
    return apiRequest<T>(path, { ...opts, retried: true });
  }
  const retryAfter = Number(res.headers.get("Retry-After")) || undefined;
  throw new ApiError(res.status, error, retryAfter);
}

/** Mencatat interaksi publik (view / whatsapp_click) secara non-blocking (API.md §7.4). */
export function trackPropertyEvent(slug: string, type: "view" | "whatsapp_click"): void {
  if (typeof window === "undefined" || !slug) return;
  void apiRequest(`/public/properties/${encodeURIComponent(slug)}/events`, {
    method: "POST",
    body: { type },
  }).catch(() => {});
}
