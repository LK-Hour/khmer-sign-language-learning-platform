import AdminUserManager from "@/features/admin/users/AdminUserManager";

export default function StudentUsersPage() {
  return <AdminUserManager roleFilter="student" />;
}
