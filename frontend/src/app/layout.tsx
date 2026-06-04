import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeRegistry from "@/theme/ThemeRegistry";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { inter, montserrat, publicSans } from "@/theme/fonts";
import { DEFAULT_LOCALE } from "@/i18n/config";
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
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${geistSans.variable} ${geistMono.variable} ${publicSans.variable} ${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReactQueryProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
