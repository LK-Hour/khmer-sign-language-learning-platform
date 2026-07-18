import type { Metadata } from "next";
import { LoginView } from "@/features/auth/components";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginView />;
}
