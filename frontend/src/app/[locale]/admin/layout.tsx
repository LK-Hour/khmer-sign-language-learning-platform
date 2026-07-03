import type { ReactNode } from "react";

import AdminShell from "@/features/admin/components/AdminShell";
import { AdminGuard } from "@/features/auth/components";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
