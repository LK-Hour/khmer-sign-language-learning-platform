import type { Metadata } from "next";
import AppProviders from "@/providers/AppProviders";
import { appFonts } from "@/theme/fonts";
import { DEFAULT_LOCALE } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khmer Sign Language",
  description: "Learn Khmer sign language and finger spelling",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${appFonts} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
