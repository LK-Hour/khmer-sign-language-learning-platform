import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth/components";

export const metadata: Metadata = {
  title: "Finger Spelling | KSL",
  description: "Learn Khmer finger spelling letter by letter with hand sign recognition",
};

export default function FingerSpellingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
