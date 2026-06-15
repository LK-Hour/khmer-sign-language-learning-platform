import { AdminGuard } from "@/features/auth/components";
import AdminQuizManager from "@/features/admin/quiz/AdminQuizManager";

export default function AdminQuizPage() {
  return (
    <AdminGuard>
      <AdminQuizManager />
    </AdminGuard>
  );
}
