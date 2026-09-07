import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth/components";

export const metadata: Metadata = {
  title: "Character to Sentence Spelling | KSL",
  description: "Learn Khmer Sign Language sentence spelling step by step",
  robots: { index: false, follow: false },
};

export default function SentenceSpellingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
