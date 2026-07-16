import type { Metadata } from "next";
import {
  DictionaryLayout,
  DictionaryPageContent,
} from "@/features/dictionary/components";
import { ROUTES } from "@/constants/routes";
import { isValidLocale } from "@/i18n/config";
import { t } from "@/i18n/translations";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/seo/config";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : "kh";

  const title = t(locale, "DICTIONARY.LIST.HEADLINE");
  const description = t(locale, "DICTIONARY.LIST.SUBHEADLINE");
  const url = absoluteUrl(`/${locale}${ROUTES.dictionary}`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(ROUTES.dictionary),
    },
    openGraph: { title, description, url },
    twitter: { title, description },
  };
}

export default function DictionaryPage() {
  return (
    <DictionaryLayout>
      <DictionaryPageContent />
    </DictionaryLayout>
  );
}
