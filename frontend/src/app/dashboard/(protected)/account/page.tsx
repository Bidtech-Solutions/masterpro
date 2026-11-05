"use client";

import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Shield,
  Upload,
  User,
  UserCircle,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api/client";
import type { User as UserType } from "@/types/user";

function evaluatePasswordComplexity(pwd: string) {
  const length = pwd.length >= 8 && pwd.length <= 72;
  const upper = /[A-Z]/.test(pwd);
  const lower = /[a-z]/.test(pwd);
  const digit = /[0-9]/.test(pwd);
  const special = /[^A-Za-z0-9\s]/.test(pwd);
  const passedCount = [length, upper, lower, digit, special].filter(Boolean).length;

  let strengthLabel = "Belum Memenuhi";
  let strengthColor = "bg-rose-500";
  if (passedCount === 5) {
    strengthLabel = "Sangat Kuat (Sesuai Kebijakan)";
    strengthColor = "bg-emerald-500";
  } else if (passedCount >= 4) {
    strengthLabel = "Cukup (Lengkapi Syarat)";
    strengthColor = "bg-amber-500";
  } else if (passedCount >= 2) {
    strengthLabel = "Lemah";
    strengthColor = "bg-orange-500";
  }

  return {
    length,
    upper,
    lower,
    digit,
    special,
    passedCount,
    valid: passedCount === 5,
    strengthLabel,
    strengthColor,
  };
}

export default function AccountDashboardPage() {
  const t = useTranslations("dashboard");
  const { user, reload } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile Form States
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(user?.agent?.whatsapp_number ?? "");
  const [serviceArea, setServiceArea] = useState(user?.agent?.service_area ?? "");
  const [bio, setBio] = useState(user?.agent?.bio ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran foto maksimal 5 MB", true);
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const updated = await apiRequest<UserType>("/account/avatar", {
        method: "POST",
        body: formData,
      });
      if (updated?.avatar_url) {
        setAvatarPreview(updated.avatar_url);
      }
      await reload();
      showToast("Foto profil berhasil diperbarui");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah foto profil";
      showToast(msg, true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Nama lengkap wajib diisi", true);
      return;
    }

    setIsSavingProfile(true);
    try {
      await apiRequest<UserType>("/account/profile", {
        method: "PATCH",
        body: {
          name: name.trim(),
          phone: phone.trim() || null,
          whatsapp_number: user?.role === "agent" ? whatsapp.trim() || undefined : undefined,
          service_area: user?.role === "agent" ? serviceArea.trim() || null : undefined,
          bio: user?.role === "agent" ? bio.trim() || null : undefined,
        },
      });
      await reload();
      showToast(t("profileUpdatedSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan perubahan profil";
      showToast(msg, true);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const complexity = evaluatePasswordComplexity(newPassword);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!complexity.valid) {
      setPasswordError(
        "Password baru wajib memenuhi seluruh syarat Password Complexity Policy (8–72 karakter, huruf besar, huruf kecil, angka, dan karakter spesial).",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch"));
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Password baru tidak boleh sama dengan password saat ini.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await apiRequest("/account/password", {
        method: "PUT",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t("passwordUpdatedSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui password";
      setPasswordError(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const roleBadge = user?.role === "admin" ? t("superAdmin") : t("roleAgent");

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
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
        <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
          {t("accountTitle")}
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">{t("accountSubtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
            activeTab === "profile"
              ? "border-sky-600 font-bold text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserCircle className="size-4" />
          <span>{t("tabProfile")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors ${
            activeTab === "security"
              ? "border-sky-600 font-bold text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock className="size-4" />
          <span>{t("tabSecurity")}</span>
        </button>
      </div>

      {/* Tab 1: Profile Form (Full-Width 12 Cols Grid) */}
      {activeTab === "profile" && (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (4 cols): Avatar & Meta Card */}
          <div className="space-y-5 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-xs">
              <div className="relative mx-auto size-32 overflow-hidden rounded-full bg-sky-100 ring-4 ring-slate-100">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={user?.name ?? "User"}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-display text-3xl font-bold text-sky-800">
                    {(user?.name ?? "MP").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="mt-4 font-display text-lg font-bold text-slate-900">{user?.name}</h2>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>{roleBadge}</span>
              </div>

              <div className="mt-5 flex justify-center border-t border-slate-100 pt-5">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Upload className="size-3.5 text-slate-500" />
                  <span>{t("uploadAvatar")}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 text-xs shadow-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("roleLabel")}</span>
                <span className="font-semibold text-slate-900 capitalize">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Status Akun</span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Aktif
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("joinedSince")}</span>
                <span className="font-semibold text-slate-900">
                  {user?.created_at
                    ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
                        new Date(user.created_at),
                      )
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Editable Profile Details */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="font-display text-base font-bold text-slate-900">Informasi Pribadi</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Perbarui rincian nama dan nomor kontak yang dapat dihubungi.
              </p>

              <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t("fullName")} *
                    </label>
                    <div className="relative mt-1.5">
                      <User className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Email Kantor (Login)
                    </label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        disabled
                        value={user?.email ?? ""}
                        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs text-slate-500 sm:text-sm"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{t("emailNotice")}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      {t("phone")}
                    </label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional fields for Agent role */}
                {user?.role === "agent" && (
                  <div className="space-y-4 border-t border-slate-100 pt-5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 sm:text-sm">
                        Profil Mitra Agen
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Informasi yang akan tampil pada kartu properti dan portal publik.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          {t("publicWhatsapp")}
                        </label>
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-sky-500 focus:outline-hidden sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          {t("serviceArea")}
                        </label>
                        <input
                          type="text"
                          value={serviceArea}
                          onChange={(e) => setServiceArea(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-sky-500 focus:outline-hidden sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700">
                          {t("bio")}
                        </label>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-sky-500 focus:outline-hidden sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="rounded-xl bg-[#0D2B6B] px-6 py-2.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-[#091E4A] disabled:opacity-50 sm:text-sm"
                  >
                    {isSavingProfile ? "Menyimpan..." : t("saveProfile")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Password (Full-Width 12 Cols Grid) */}
      {activeTab === "security" && (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (7 cols): Form Ganti Password */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {t("tabSecurity")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui password login Anda menggunakan standar Password Complexity Policy.
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    {t("currentPassword")} *
                  </label>
                  <div className="relative mt-1.5">
                    <KeyRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pr-10 pl-10 text-xs focus:border-sky-500 focus:outline-hidden sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    {t("newPassword")} *
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pr-10 pl-10 text-xs focus:border-sky-500 focus:outline-hidden sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    {t("confirmNewPassword")} *
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 pr-10 pl-10 text-xs focus:border-sky-500 focus:outline-hidden sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="submit"
                    disabled={!complexity.valid || isSavingPassword}
                    className="rounded-xl bg-[#0D2B6B] px-6 py-2.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-[#091E4A] disabled:opacity-50 sm:text-sm"
                  >
                    {isSavingPassword ? "Memperbarui..." : t("updatePassword")}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (5 cols): Panel Indikator Password Complexity Policy & Info Sesi */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Password Complexity Policy
                </h4>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    complexity.valid
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {newPassword ? complexity.strengthLabel : "0/5 Syarat"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all ${
                      newPassword && complexity.passedCount >= step
                        ? complexity.strengthColor
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <ul className="mt-4 space-y-2.5 text-xs">
                {[
                  { ok: complexity.length, text: "Panjang 8–72 karakter" },
                  { ok: complexity.upper, text: "Minimal 1 huruf besar (A–Z)" },
                  { ok: complexity.lower, text: "Minimal 1 huruf kecil (a–z)" },
                  { ok: complexity.digit, text: "Minimal 1 angka (0–9)" },
                  { ok: complexity.special, text: "Minimal 1 simbol spesial (!@#$%^&*)" },
                ].map((item) => (
                  <li
                    key={item.text}
                    className={`flex items-center gap-2 ${
                      item.ok ? "font-semibold text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-full ${
                        item.ok
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Check className="size-3" />
                    </span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
                <strong>Catatan Keamanan:</strong> Mengubah password akan otomatis mencabut sesi login lama di perangkat lain, sedangkan sesi pada perangkat Anda saat ini tetap aktif.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
