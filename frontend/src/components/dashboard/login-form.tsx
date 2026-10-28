"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";

import { apiRequest, refreshSession } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { loginSchema } from "@/schemas/auth";
import type { LoginResponse } from "@/types/user";

type MessageKey = Parameters<ReturnType<typeof useTranslations<"dashboard">>>[0];

/** Form login dashboard (AUTH-01, AUTH-05, AUTH-06). */
export function LoginForm() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Cookie akses berumur 15 menit; bila refresh token masih valid, masuk kembali tanpa mengetik.
  useEffect(() => {
    void refreshSession().then((ok) => ok && router.replace(next));
  }, [next, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) {
      const errs: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "email" | "password";
        errs[key] ??= t(issue.message as MessageKey);
      }
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest<LoginResponse>("/auth/login", { method: "POST", body: parsed.data });
      router.replace(next);
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "INVALID_CREDENTIALS") setError(t("errorInvalid"));
        else if (err.code === "ACCOUNT_INACTIVE") setError(t("errorInactive"));
        else if (err.code === "RATE_LIMITED")
          setError(t("errorRateLimited", { seconds: err.retryAfter ?? 60 }));
        else setError(t("errorGeneric"));
      } else {
        setError(t("errorGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-body-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30 focus:outline-none aria-invalid:border-danger";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-danger"
        >
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-body-sm font-medium text-slate-700">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.email ? (
          <p id="email-error" className="mt-1 text-caption text-danger">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-body-sm font-medium text-slate-700">
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-navy-900"
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="password-error" className="mt-1 text-caption text-danger">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 font-display text-body-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        <LogIn className="size-4" aria-hidden />
        {submitting ? t("loggingIn") : t("submitLogin")}
      </button>
      <p className="text-center text-caption text-slate-500">{t("forgotPassword")}</p>
    </form>
  );
}

/** Hanya izinkan redirect internal ke /dashboard (cegah open redirect). */
function safeNext(value: string | null): string {
  return value && value.startsWith("/dashboard") && !value.startsWith("//") ? value : "/dashboard";
}
