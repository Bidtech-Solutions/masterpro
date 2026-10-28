import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthProvider } from "@/providers/auth-provider";

/** Shell dashboard terproteksi: sidebar + topbar + guard sesi (PRD §6, DESIGN.md §6.8). */
export default function ProtectedLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
