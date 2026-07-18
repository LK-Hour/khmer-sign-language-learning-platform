import type { Metadata } from "next";
import LandingPage from "@/features/landing/LandingPage";
import { isValidLocale } from "@/i18n/config";
import { t } from "@/i18n/translations";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/seo/config";
import JsonLd from "@/lib/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structuredData";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : "kh";

  const title = t(locale, "HOME.TITLE");
  const description = t(locale, "HOME.SUBTITLE");
  const url = absoluteUrl(`/${locale}`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates("/"),
    },
    openGraph: {
      title,
      description,
      url,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function Home({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : "kh";

  return (
    <>
      <JsonLd data={websiteJsonLd(locale)} />
      <JsonLd data={organizationJsonLd()} />
      <LandingPage />
    </>
  );
}
