import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeRegistry from "@/theme/ThemeRegistry";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { Locale } from "@/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Khmer Sign Language",
  description: "Learn Khmer sign language and finger spelling",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale?: Locale }>;
}

export async function generateStaticParams() {
  return [{ locale: "kh" }, { locale: "en" }];
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale = "kh" } = await params;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale}>
          <ThemeRegistry>{children}</ThemeRegistry>
        </LocaleProvider>
      </body>
    </html>
  );
}
