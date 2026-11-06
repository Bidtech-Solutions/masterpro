"use client";

import {
  Check,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api/client";
import type { User } from "@/types/user";

type RoleDisplayFilter = "all" | "superadmin" | "admin" | "agent";

function checkPasswordComplexity(pwd: string) {
  const length = pwd.length >= 8 && pwd.length <= 72;
  const upper = /[A-Z]/.test(pwd);
  const lower = /[a-z]/.test(pwd);
  const digit = /[0-9]/.test(pwd);
  const special = /[^A-Za-z0-9\s]/.test(pwd);
  const score = [length, upper, lower, digit, special].filter(Boolean).length;
  return {
    length,
    upper,
    lower,
    digit,
    special,
    score,
    valid: score === 5,
  };
}

export default function UsersDashboardPage() {
  const t = useTranslations("dashboard");
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleDisplayFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Edit User Modal
  const [editTargetUser, setEditTargetUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("MasterPro2026!");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let mounted = true;
    async function loadUsers() {
      try {
        const res = await apiRequest<User[]>("/users?per_page=100");
        if (mounted && Array.isArray(res)) {
          setUsers(res);
        }
      } catch {
        if (mounted) {
          setUsers([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    void loadUsers();
    return () => {
      mounted = false;
    };
  }, []);

  // Identify primary Super Admin (admin@masterpro.co.id or earliest admin)
  const superAdminId = useMemo(() => {
    const primaryByEmail = users.find(
      (u) => u.role === "admin" && u.email.toLowerCase() === "admin@masterpro.co.id",
    );
    if (primaryByEmail) return primaryByEmail.id;
    const admins = users
      .filter((u) => u.role === "admin")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return admins[0]?.id ?? null;
  }, [users]);

  const getUserTier = useCallback(
    (u: User): "superadmin" | "admin" | "agent" => {
      if (u.role === "agent") return "agent";
      if (u.id === superAdminId || u.email.toLowerCase() === "admin@masterpro.co.id") {
        return "superadmin";
      }
      return "admin";
    },
    [superAdminId],
  );

  const roleCounts = useMemo(() => {
    let superadmin = 0;
    let admin = 0;
    let agent = 0;
    for (const u of users) {
      const tier = getUserTier(u);
      if (tier === "superadmin") superadmin++;
      else if (tier === "admin") admin++;
      else agent++;
    }
    return {
      all: users.length,
      superadmin,
      admin,
      agent,
    };
  }, [users, getUserTier]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const tier = getUserTier(u);
      if (roleFilter !== "all" && tier !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchCode = u.agent?.agent_code?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchEmail && !matchCode) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery, getUserTier]);

  const handleToggleStatus = async (u: User) => {
    if (currentUser?.id === u.id || currentUser?.email === u.email) {
      showToast("Anda tidak dapat menonaktifkan akun Anda sendiri demi keamanan.", true);
      return;
    }

    const nextStatus = u.status === "active" ? "inactive" : "active";
    try {
      const updated = await apiRequest<User>(`/users/${u.id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setUsers((prev) => prev.map((item) => (item.id === u.id ? updated : item)));
      window.dispatchEvent(new CustomEvent("masterpro-summary-refresh"));
      showToast(
        `Status akun ${u.name} berhasil diubah menjadi ${nextStatus === "active" ? "Aktif" : "Nonaktif"}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status pengguna";
      showToast(msg, true);
    }
  };

  const openEditModal = (u: User) => {
    setEditTargetUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPhone(u.phone || "");
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetUser || !editName.trim() || !editEmail.trim()) return;

    setIsSubmittingEdit(true);
    try {
      const updated = await apiRequest<User>(`/users/${editTargetUser.id}`, {
        method: "PATCH",
        body: {
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          phone: editPhone.trim() || null,
        },
      });
      setUsers((prev) => prev.map((item) => (item.id === editTargetUser.id ? updated : item)));
      setEditTargetUser(null);
      showToast("Data pengguna berhasil diperbarui");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui pengguna";
      showToast(msg, true);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const resetPwdCheck = checkPasswordComplexity(newPassword);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (!resetPwdCheck.valid) {
      showToast("Password baru belum memenuhi seluruh syarat Password Complexity Policy.", true);
      return;
    }

    setIsSubmittingReset(true);
    try {
      await apiRequest(`/users/${resetTargetUser.id}/password`, {
        method: "PUT",
        body: { new_password: newPassword },
      });
      setResetTargetUser(null);
      showToast(t("resetPasswordSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mereset password";
      showToast(msg, true);
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return t("neverLoggedIn");
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString));
  };

  return (
    <div className="w-full space-y-6">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">{t("usersTitle")}</h1>
            <span className="bg-navy-100 rounded-full px-2.5 py-0.5 text-xs font-bold text-navy-800">
              {users.length} Akun
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{t("usersSubtitle")}</p>
        </div>

        <div>
          <NextLink
            href="/dashboard/users/new"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0284C7] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0369A1] active:scale-[0.98] sm:self-auto sm:text-sm"
          >
            <Plus className="size-4" />
            <span>{t("addUser")}</span>
          </NextLink>
        </div>
      </div>

      {/* Toolbar Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchUserPlaceholder")}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pr-4 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleDisplayFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-hidden"
          >
            <option value="all">Semua Role ({roleCounts.all})</option>
            <option value="superadmin">Super Admin ({roleCounts.superadmin})</option>
            <option value="admin">Admin ({roleCounts.admin})</option>
            <option value="agent">Agent ({roleCounts.agent})</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                <th scope="col" className="px-5 py-3.5">
                  {t("thUserName")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Email & Telepon
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thUserRole")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thStatus")}
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t("thLastLogin")}
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  {t("thActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat daftar pengguna dari database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada akun pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const tier = getUserTier(u);
                  const isSelf = currentUser?.id === u.id || currentUser?.email === u.email;

                  return (
                    <tr key={u.id} className="transition-colors hover:bg-slate-50/70">
                      {/* User Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-bold text-slate-600 ring-1 ring-slate-200">
                            {u.avatar_url ? (
                              <Image
                                src={u.avatar_url}
                                alt={u.name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            ) : (
                              u.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900">{u.name}</p>
                              {isSelf && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                  Anda
                                </span>
                              )}
                            </div>
                            {u.agent ? (
                              <NextLink
                                href={`/dashboard/agents/${u.agent.id}`}
                                className="font-mono text-[10px] font-semibold text-sky-600 hover:underline"
                              >
                                {u.agent.agent_code} • Lihat Profil Agen
                              </NextLink>
                            ) : (
                              <p className="font-mono text-[10px] text-slate-400">ID: {u.id.slice(0, 8)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{u.email}</p>
                        <p className="text-[11px] text-slate-400">
                          {u.phone || u.agent?.whatsapp_number || "-"}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {tier === "superadmin" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                            <Crown className="size-3" />
                            Super Admin
                          </span>
                        ) : tier === "admin" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-800">
                            <ShieldCheck className="size-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-800">
                            <UserCheck className="size-3" />
                            Agent
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.status === "active" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            <span className="size-1.5 rounded-full bg-slate-400" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3.5 text-[11px] whitespace-nowrap text-slate-600">
                        {formatDate(u.last_login_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            title="Edit Pengguna"
                          >
                            <Pencil className="size-3 text-slate-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResetTargetUser(u);
                              setNewPassword("MasterPro2026!");
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <KeyRound className="size-3 text-slate-400" />
                            <span>{t("actionResetPassword")}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(u)}
                            disabled={isSelf}
                            className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                              isSelf
                                ? "cursor-not-allowed border-slate-100 text-slate-300"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Pengguna */}
      {editTargetUser && (
        <div className="backdrop-blur-2xs fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900">Edit Akun Pengguna</h3>
              <button
                type="button"
                onClick={() => setEditTargetUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Login *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Nomor Telepon</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTargetUser(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0369A1] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmittingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password (dengan Password Complexity Policy) */}
      {resetTargetUser && (
        <div className="backdrop-blur-2xs fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-slate-900">{t("actionResetPassword")}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Reset password untuk <strong>{resetTargetUser.name}</strong> ({resetTargetUser.email}).
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Password Baru (Password Complexity Policy) *
                </label>
                <div className="relative mt-1">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 pr-9 pl-3 font-mono text-xs focus:border-sky-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showResetPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Checklist Password Complexity Policy */}
                <div className="mt-2.5 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px]">
                  <p className="font-bold text-slate-700">Syarat Password Complexity Policy:</p>
                  {[
                    { ok: resetPwdCheck.length, label: "Panjang 8 hingga 72 karakter" },
                    { ok: resetPwdCheck.upper, label: "Minimal 1 huruf besar (A–Z)" },
                    { ok: resetPwdCheck.lower, label: "Minimal 1 huruf kecil (a–z)" },
                    { ok: resetPwdCheck.digit, label: "Minimal 1 angka (0–9)" },
                    { ok: resetPwdCheck.special, label: "Minimal 1 karakter spesial (!@#$%^&*)" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-1.5 ${
                        item.ok ? "font-semibold text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      <Check className={`size-3.5 ${item.ok ? "text-emerald-600" : "text-slate-300"}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!resetPwdCheck.valid || isSubmittingReset}
                  className="rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0369A1] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmittingReset ? "Menyimpan..." : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
