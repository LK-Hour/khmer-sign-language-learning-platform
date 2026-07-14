import type { ReactNode } from "react";

import AdminShell from "@/features/admin/components/AdminShell";
import AdminThemeProvider from "@/features/admin/theme/AdminThemeProvider";
import { AdminGuard } from "@/features/auth/components";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminThemeProvider>
        <AdminShell>{children}</AdminShell>
      </AdminThemeProvider>
    </AdminGuard>
  );
}
