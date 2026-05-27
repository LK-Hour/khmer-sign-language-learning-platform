import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finger Spelling | KSL",
  description: "Learn Khmer finger spelling letter by letter",
};

export default function FingerSpellingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
