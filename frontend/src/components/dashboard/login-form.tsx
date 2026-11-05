"use client";

import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";

import { apiRequest, notifyAuthChange, refreshSession, subscribeAuthChange } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { LoginResponse, User } from "@/types/user";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(value: string | null): string {
  return value && value.startsWith("/dashboard") && !value.startsWith("//") && !value.startsWith("/dashboard/login")
    ? value
    : "/dashboard";
}

/**
 * Form login dashboard (AUTH-01, AUTH-02, AUTH-06; DESIGN.md §7.1).
 * Cookie sesi httpOnly diset langsung oleh backend pada respons 200.
 */
export function LoginForm() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = safeNext(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      try {
        await apiRequest<User>("/auth/me");
        if (active) {
          router.replace(nextUrl);
        }
      } catch {
        const refreshed = await refreshSession();
        if (active && refreshed) {
          router.replace(nextUrl);
        }
      }
    }

    void checkExistingSession();

    const unsubscribe = subscribeAuthChange((event) => {
      if (event === "LOGIN") {
        router.replace(nextUrl);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [nextUrl, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBannerError(null);

    const nextFieldErrors: { email?: string; password?: string } = {};
    if (!emailPattern.test(email.trim())) nextFieldErrors.email = t("errorEmail");
    if (!password) nextFieldErrors.password = t("errorPasswordRequired");
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      notifyAuthChange("LOGIN");
      router.replace(nextUrl);
      router.refresh();
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "INVALID_CREDENTIALS") {
          setBannerError(t("errorInvalid"));
        } else if (err.code === "ACCOUNT_INACTIVE") {
          setBannerError(t("errorInactive"));
        } else if (err.code === "ALREADY_AUTHENTICATED") {
          setBannerError(t("errorAlreadyAuthenticated"));
          router.replace(nextUrl);
        } else if (err.code === "RATE_LIMITED") {
          setBannerError(t("errorRateLimited", { seconds: err.retryAfter ?? 60 }));
        } else {
          setBannerError(t("errorGeneric"));
        }
      } else {
        setBannerError(t("errorGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Header Form */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("loginTitle")}
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
          {t("loginSubtitle")}
        </p>
      </div>

      {/* Pesan Error Autentikasi */}
      {bannerError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
          <span>{bannerError}</span>
        </div>
      ) : null}

      {/* Input Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-slate-700">
          {t("email")}
        </label>
        <div className="relative mt-1.5">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3.5 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden aria-[invalid=true]:border-red-500 sm:text-sm"
          />
        </div>
        {fieldErrors.email ? (
          <p id="email-error" className="mt-1.5 text-xs font-medium text-red-600">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      {/* Input Password */}
      <div>
        <label htmlFor="password" className="block text-xs font-bold text-slate-700">
          {t("password")}
        </label>
        <div className="relative mt-1.5">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden aria-[invalid=true]:border-red-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="password-error" className="mt-1.5 text-xs font-medium text-red-600">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {/* Tombol Masuk */}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span>{t("loggingIn")}</span>
          </>
        ) : (
          <span>{t("submitLogin")}</span>
        )}
      </button>

      {/* Info Bantuan */}
      <div className="pt-2 text-center">
        <p className="text-xs text-slate-400">{t("forgotPassword")}</p>
      </div>
    </form>
  );
}
