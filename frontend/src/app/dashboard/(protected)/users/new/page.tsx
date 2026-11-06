"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Plus,
  User,
  XCircle,
} from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { apiRequest } from "@/lib/api/client";
import type { User as UserType } from "@/types/user";

export default function NewAdminUserPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("AdminPro2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const pwdChecks = {
    length: password.length >= 8 && password.length <= 72,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
  };
  const isPasswordStrong =
    pwdChecks.length && pwdChecks.upper && pwdChecks.lower && pwdChecks.digit && pwdChecks.special;

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setToast({ message: "Nama lengkap admin wajib diisi", isError: true });
      return;
    }
    if (!email.trim()) {
      setToast({ message: "Email login resmi wajib diisi", isError: true });
      return;
    }
    if (!isPasswordStrong) {
      setToast({
        message: "Password awal belum memenuhi seluruh syarat Password Complexity Policy.",
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      await apiRequest<UserType>("/users", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          password,
        },
      });

      setToast({ message: t("userCreatedSuccess") });
      setTimeout(() => {
        router.push("/dashboard/users");
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat akun admin baru";
      setToast({ message: msg, isError: true });
      setIsSubmitting(false);
    }
  };

  const complexityRules = [
    { ok: pwdChecks.length, label: "Min. 8 karakter" },
    { ok: pwdChecks.upper, label: "Huruf besar (A–Z)" },
    { ok: pwdChecks.lower, label: "Huruf kecil (a–z)" },
    { ok: pwdChecks.digit, label: "Angka (0–9)" },
    { ok: pwdChecks.special, label: "Simbol (!@#$)" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all ${
            toast.isError ? "border border-rose-700 bg-rose-900" : "bg-slate-900"
          }`}
        >
          {toast.isError ? (
            <XCircle className="size-5 text-rose-400" />
          ) : (
            <CheckCircle2 className="size-5 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div>
        <NextLink
          href="/dashboard/users"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Manajemen Pengguna</span>
        </NextLink>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("addUser")}
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Daftarkan akun staf administrator baru untuk mengelola properti, agen mitra, dan operasional
          MasterPro.
        </p>
      </div>

      {/* Form Tambah Admin */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <User className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Identitas & Kredensial Akun Admin
              </h2>
              <p className="text-xs text-slate-500">
                Lengkapi informasi nama, email resmi, dan kata sandi awal staf admin.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Nama Lengkap Admin <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <User className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rina Kartika"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Email Login Resmi <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.rina@masterpro.co.id"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Nomor Telepon / Seluler</label>
              <div className="relative mt-1.5">
                <Phone className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-7000-8899"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4 sm:p-5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Lock className="size-3.5 text-sky-600" />
                  <span>Password Awal Akun Admin</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-2xs">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent font-mono text-xs font-semibold text-slate-900 focus:outline-hidden sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-700"
                    title={showPassword ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{t("copiedPassword")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-slate-400" />
                        <span>{t("copyPasswordBtn")}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Password Complexity Policy Checklist Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {complexityRules.map((rule) => (
                    <span
                      key={rule.label}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                        rule.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/70 text-slate-500"
                      }`}
                    >
                      <Check className="size-3" />
                      <span>{rule.label}</span>
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-[11px] text-slate-500">
                  Salin dan berikan password awal ini kepada staf admin terkait. Admin dapat menggantinya
                  kapan saja melalui menu Akun Saya.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <NextLink
              href="/dashboard/users"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 sm:text-sm"
            >
              {t("cancel")}
            </NextLink>
            <button
              type="submit"
              disabled={!isPasswordStrong || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] active:scale-[0.98] disabled:opacity-50 sm:text-sm"
            >
              <Plus className="size-4" />
              <span>{isSubmitting ? "Menyimpan..." : t("addUser")}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
