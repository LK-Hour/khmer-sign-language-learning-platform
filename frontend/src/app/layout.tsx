import type { Metadata } from "next";
import AppProviders from "@/providers/AppProviders";
import { DEFAULT_LOCALE } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khmer Sign Language Platform",
  description: "Learn Khmer sign language and finger spelling with AI-powered recognition",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={DEFAULT_LOCALE} style={{ height: "100%" }}>
      <body style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
