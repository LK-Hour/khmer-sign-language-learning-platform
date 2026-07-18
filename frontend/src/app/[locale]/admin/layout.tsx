import type { ReactNode } from "react";
import type { Metadata } from "next";

import AdminShell from "@/features/admin/components/AdminShell";
import AdminThemeProvider from "@/features/admin/theme/AdminThemeProvider";
import { AdminGuard } from "@/features/auth/components";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminThemeProvider>
        <AdminShell>{children}</AdminShell>
      </AdminThemeProvider>
    </AdminGuard>
  );
}
