import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth/components";

export const metadata: Metadata = {
  title: "Word Detection | KSL",
  description: "Learn Khmer Sign Language word detection step by step with video samples",
  robots: { index: false, follow: false },
};

export default function WordDetectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
