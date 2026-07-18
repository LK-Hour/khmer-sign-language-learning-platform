import type { Metadata } from "next";
import { headers } from "next/headers";
import AppProviders from "@/providers/AppProviders";
import { DEFAULT_LOCALE, isValidLocale } from "@/i18n/config";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo/config";
import { LOCALE_HEADER, toLanguageTag } from "@/lib/seo/config";
import "./globals.css";

const DESCRIPTION =
  "Learn Khmer Sign Language with AI-powered recognition. Practice finger spelling and word signs with real-time feedback, and browse the Khmer sign dictionary.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: "/favicon/favicon.ico",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get(LOCALE_HEADER);
  const lang = isValidLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;

  return (
    <html lang={toLanguageTag(lang)} style={{ height: "100%" }}>
      <body style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
