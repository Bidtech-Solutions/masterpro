"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Upload,
  User,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { apiRequest } from "@/lib/api/client";
import type { Agent } from "@/types/agent";

export default function NewAgentPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [emailPrefix, setEmailPrefix] = useState("");
  const [password, setPassword] = useState("MasterPro2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: "Ukuran foto maksimal 5 MB", isError: true });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

  // Password Complexity Policy checks
  const pwdChecks = {
    length: password.length >= 8 && password.length <= 72,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
  };
  const isPasswordStrong =
    pwdChecks.length && pwdChecks.upper && pwdChecks.lower && pwdChecks.digit && pwdChecks.special;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setToast({ message: "Nama lengkap agen wajib diisi", isError: true });
      return;
    }

    if (!emailPrefix.trim()) {
      setToast({ message: "Email perusahaan wajib diisi", isError: true });
      return;
    }

    if (!isPasswordStrong) {
      setToast({
        message:
          "Password harus memenuhi Password Complexity Policy (min. 8 karakter, huruf besar, huruf kecil, angka, dan karakter spesial)",
        isError: true,
      });
      return;
    }

    if (!whatsapp.trim()) {
      setToast({ message: "Nomor WhatsApp wajib diisi", isError: true });
      return;
    }

    let cleanEmail = emailPrefix.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      cleanEmail = `${cleanEmail}@masterpro.co.id`;
    }

    let cleanWa = whatsapp.trim().replace(/[^0-9]/g, "");
    if (cleanWa.startsWith("0")) {
      cleanWa = "62" + cleanWa.slice(1);
    } else if (cleanWa.startsWith("8")) {
      cleanWa = "62" + cleanWa;
    } else if (!cleanWa.startsWith("62")) {
      cleanWa = "62" + cleanWa;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const newAgent = await apiRequest<Agent>("/agents", {
        method: "POST",
        body: {
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim() || null,
          password: password,
          whatsapp_number: cleanWa,
          bio: specialty.trim() ? `${specialty.trim()}` : null,
          service_area: "Kota Batam",
          joined_at: new Date().toISOString().split("T")[0],
        },
      });

      if (photoFile && newAgent?.id) {
        const formData = new FormData();
        formData.append("file", photoFile);

        try {
          await apiRequest(`/agents/${newAgent.id}/photo`, {
            method: "POST",
            body: formData,
          });
        } catch {
          // Proceed since agent is created
        }
      }

      window.dispatchEvent(new CustomEvent("masterpro-summary-refresh"));

      setToast({ message: t("agentCreatedSuccessToast") });
      setTimeout(() => {
        router.push("/dashboard/agents");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("agentCreateFailed");
      setToast({ message: msg, isError: true });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
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
          href="/dashboard/agents"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Manajemen Agen</span>
        </NextLink>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("addNewAgentTitle")}
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">{t("addNewAgentSubtitle")}</p>
      </div>

      {/* Form Full-Width 2 Kolom (Foto di Kiri lg:col-span-4, Identitas & Akun di Kanan lg:col-span-8) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri (4 cols): Foto Profil Agen */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Camera className="size-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">Foto Profil Agen</h2>
            </div>

            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 p-6 text-center">
              <div className="relative size-36 shrink-0 overflow-hidden rounded-full bg-sky-50 shadow-xs ring-4 ring-white">
                {photoPreview ? (
                  <Image src={photoPreview} alt="Preview" fill sizes="144px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sky-400">
                    <User className="size-16" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-1 bottom-1 flex size-8 items-center justify-center rounded-full bg-[#0284C7] text-white ring-2 ring-white transition-colors hover:bg-[#0369A1]"
                  title="Pilih Foto"
                >
                  <Camera className="size-4" />
                </button>
              </div>

              <p className="mt-3 text-xs font-bold text-slate-800">{name.trim() || "Nama Agen Baru"}</p>
              <p className="text-[11px] text-slate-400">
                {specialty.trim() || "Property Consultant MasterPro"}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] active:scale-[0.98]"
                >
                  <Upload className="size-3.5" />
                  <span>{t("choosePhotoBtn")}</span>
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-rose-600"
                  >
                    <X className="size-3.5" />
                    <span>{t("removePhotoBtn")}</span>
                  </button>
                )}
              </div>

              <p className="mt-3 text-[11px] text-slate-400">Format JPG, PNG, atau WebP (Maks. 5 MB).</p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (8 cols): Identitas, Akun Login & Kontak Resmi */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Identitas Agen */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <User className="size-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">{t("cardPhotoIdentityTitle")}</h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t("agentFullNameLabel")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("agentFullNamePlaceholder")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">{t("agentSpecialtyLabel")}</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder={t("agentSpecialtyPlaceholder")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Akun Login & Kontak Resmi */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Lock className="size-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                {t("cardAccountContactTitle")}
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* 1. Email Perusahaan (@masterpro.co.id) */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t("companyEmailLabel")} <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-sky-500">
                  <div className="flex items-center pl-3.5 text-slate-400">
                    <Mail className="size-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailPrefix}
                    onChange={(e) => setEmailPrefix(e.target.value)}
                    placeholder="hendra.wijaya"
                    className="w-full bg-white px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden sm:text-sm"
                  />
                  <span className="flex items-center border-l border-slate-100 bg-slate-50 px-3 text-xs font-semibold text-slate-500 select-none">
                    @masterpro.co.id
                  </span>
                </div>
              </div>

              {/* 2. Password Awal Akun */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    {t("initialPasswordLabel")} <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
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
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3 text-emerald-600" />
                        <span className="text-emerald-700">{t("copiedPassword")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-slate-400" />
                        <span>{t("copyPasswordBtn")}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[
                    { ok: pwdChecks.length, label: "8–72 Karakter" },
                    { ok: pwdChecks.upper, label: "Huruf Besar (A-Z)" },
                    { ok: pwdChecks.lower, label: "Huruf Kecil (a-z)" },
                    { ok: pwdChecks.digit, label: "Angka (0-9)" },
                    { ok: pwdChecks.special, label: "Simbol (!@#$)" },
                  ].map((rule) => (
                    <span
                      key={rule.label}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        rule.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Check className="size-2.5" />
                      <span>{rule.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. Nomor Telepon Seluler */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t("cellPhoneLabel")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
                    <Phone className="size-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("cellPhonePlaceholder")}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                  />
                </div>
              </div>

              {/* 4. Nomor WhatsApp Resmi */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t("officialWhatsappLabel")} <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-sky-500">
                  <span className="flex items-center gap-1.5 border-r border-slate-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 select-none">
                    <MessageCircle className="size-3.5 fill-emerald-500 text-emerald-500" />
                    <span>+62</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="81270008899"
                    className="w-full bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <NextLink
                href="/dashboard/agents"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 sm:text-sm"
              >
                {t("cancel")}
              </NextLink>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] active:scale-[0.98] disabled:opacity-50 sm:text-sm"
              >
                <UserPlus className="size-4" />
                <span>{isSubmitting ? "Menyimpan..." : t("addNewAgentTitle")}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
