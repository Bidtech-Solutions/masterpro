"use client";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Upload,
  User,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { apiRequest } from "@/lib/api/client";
import type { Agent } from "@/types/agent";

export default function EditAgentProfilePage() {
  const t = useTranslations("dashboard");
  const params = useParams();
  const router = useRouter();

  const agentId = (params?.id as string) || "";

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editServiceArea, setEditServiceArea] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadAgent() {
      if (!agentId) return;
      try {
        const res = await apiRequest<Agent>(`/agents/${agentId}`);
        if (mounted && res && res.id) {
          setAgent(res);
          setEditName(res.user.name);
          setEditPhone(res.user.phone || "");
          setEditWhatsapp(res.whatsapp_number);
          setEditBio(res.bio || "");
          setEditServiceArea(res.service_area || "");
          setEditStatus(res.user.status);
          setAvatarPreview(res.user.avatar_url);
        }
      } catch {
        if (mounted) {
          setAgent(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    void loadAgent();
    return () => {
      mounted = false;
    };
  }, [agentId]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: "Ukuran foto maksimal 5 MB", isError: true });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleResetPhotoSelection = () => {
    setAvatarFile(null);
    setAvatarPreview(agent?.user.avatar_url ?? null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !agent) {
      setToast({ message: "Nama lengkap agen wajib diisi", isError: true });
      return;
    }

    let cleanWa = editWhatsapp.trim().replace(/[^0-9]/g, "");
    if (cleanWa.startsWith("0")) {
      cleanWa = "62" + cleanWa.slice(1);
    } else if (cleanWa.startsWith("8")) {
      cleanWa = "62" + cleanWa;
    } else if (cleanWa && !cleanWa.startsWith("62")) {
      cleanWa = "62" + cleanWa;
    }

    setIsSubmitting(true);
    setToast(null);
    try {
      await apiRequest<Agent>(`/agents/${agentId}`, {
        method: "PATCH",
        body: {
          name: editName.trim(),
          phone: editPhone.trim() || null,
          whatsapp_number: cleanWa || editWhatsapp.trim(),
          bio: editBio.trim() || null,
          service_area: editServiceArea.trim() || null,
          status: editStatus,
        },
      });

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        try {
          await apiRequest<Agent>(`/agents/${agentId}/photo`, {
            method: "POST",
            body: formData,
          });
        } catch {
          // Non-blocking
        }
      }

      window.dispatchEvent(new CustomEvent("masterpro-summary-refresh"));

      setToast({ message: t("agentProfileUpdatedSuccess"), isError: false });
      setTimeout(() => {
        router.push(`/dashboard/agents/${agentId}`);
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui profil agen";
      setToast({ message: msg, isError: true });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-xs text-slate-400">
        Memuat data profil agen...
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-bold text-slate-800">Agen tidak ditemukan</p>
        <p className="mt-1 text-xs text-slate-500">
          Data agen dengan ID tersebut tidak tersedia di database.
        </p>
        <NextLink
          href="/dashboard/agents"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Daftar Agen</span>
        </NextLink>
      </div>
    );
  }

  const initials = editName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all ${
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

      {/* Breadcrumb & Header */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <NextLink
            href="/dashboard/agents"
            className="inline-flex items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="size-3.5" />
            <span>Manajemen Agen</span>
          </NextLink>
          <span>/</span>
          <NextLink
            href={`/dashboard/agents/${agent.id}`}
            className="text-slate-500 transition-colors hover:text-slate-800"
          >
            {agent.user.name}
          </NextLink>
          <span>/</span>
          <span className="font-bold text-slate-900">Edit Profil Agen</span>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("editProfileTitle")}
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Perbarui foto profil, identitas, kontak resmi WhatsApp, spesialisasi, dan status kemitraan agen.
        </p>
      </div>

      {/* Form 2 Kolom Full-Width: Gambar di Sebelah Kiri (4 cols) & Form di Sebelah Kanan (8 cols) */}
      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Foto Profil Agen & Status Kemitraan */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
              Foto Profil Agen
            </h2>

            <div className="mt-5 flex flex-col items-center text-center">
              <div className="relative size-44 overflow-hidden rounded-3xl border border-slate-200 bg-sky-50 shadow-sm ring-4 ring-slate-50">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={editName || "Foto Agen"}
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-display text-4xl font-extrabold text-sky-700">
                    {initials || <User className="size-16 text-sky-400" />}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-xl bg-[#0284C7] text-white shadow-md transition-colors hover:bg-[#0369A1]"
                  title="Ganti Foto"
                >
                  <Camera className="size-4" />
                </button>
              </div>

              <p className="mt-4 font-display text-lg font-bold text-slate-900">
                {editName || agent.user.name}
              </p>
              <span className="mt-0.5 font-mono text-xs font-semibold text-sky-700">
                {agent.agent_code}
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1]"
                >
                  <Upload className="size-3.5" />
                  <span>Ganti Foto Profil</span>
                </button>

                {avatarFile && (
                  <button
                    type="button"
                    onClick={handleResetPhotoSelection}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-rose-600"
                  >
                    <X className="size-3.5" />
                    <span>Batal Ganti</span>
                  </button>
                )}
              </div>

              <p className="mt-2.5 text-[11px] text-slate-400">
                Format JPG, PNG, atau WebP (Maks. 5 MB).
              </p>
            </div>

            {/* Info Akun & Status Kemitraan */}
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">
                  Status Kemitraan Agen
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "active" | "inactive")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-hidden"
                >
                  <option value="active">Aktif (Menerima Listing)</option>
                  <option value="inactive">Nonaktif / Cuti Sementara</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1 text-slate-500">
                <span>Email Akun Login</span>
                <span className="font-semibold text-slate-800">{agent.user.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Total Listing Aktif</span>
                <span className="font-bold text-emerald-700">
                  {agent.listing_counts?.active ?? 0} Properti
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Detail Identitas, Kontak, dan Spesialisasi */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <User className="size-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Identitas & Kontak Resmi Keagenan
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Lengkap Agen <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <User className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Email Kantor (Read-only)
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={agent.user.email}
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs text-slate-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nomor Telepon Seluler
                </label>
                <div className="relative mt-1.5">
                  <Phone className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="0812-7788-9900"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nomor WhatsApp Resmi <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-sky-500">
                  <span className="flex items-center gap-1.5 border-r border-slate-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 select-none">
                    <MessageCircle className="size-3.5 fill-emerald-500 text-emerald-500" />
                    <span>WA</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="6281277889900"
                    className="w-full bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Area Layanan Utama
                </label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={editServiceArea}
                    onChange={(e) => setEditServiceArea(e.target.value)}
                    placeholder="Batam Centre, Sukajadi, Nagoya"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  Bio & Spesialisasi Profil Publik
                </label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Contoh: Senior Property Consultant spesialis klaster residensial mewah Sukajadi & Batam Centre..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-hidden sm:text-sm"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Deskripsi singkat keahlian agen yang akan tampil di halaman daftar agen dan kartu kontak properti.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <NextLink
                href={`/dashboard/agents/${agent.id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 sm:text-sm"
              >
                {t("cancelEditBtn")}
              </NextLink>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] disabled:opacity-50 sm:text-sm"
              >
                <Save className="size-4" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

