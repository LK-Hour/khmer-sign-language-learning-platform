import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { ROUTES } from "@/constants/routes";
import { fetchAllDictionaryWords } from "@/features/dictionary/api/dictionary";
import { DictionaryBrowser } from "@/features/dictionary/components";
import type { DictionaryWord } from "@/features/dictionary/types";
import { isValidLocale } from "@/i18n/config";
import { t } from "@/i18n/translations";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/seo/config";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

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

export default async function DictionaryPage({ searchParams }: PageProps) {
  const query = await searchParams;

  // Fetched on the server so every entry is in the initial HTML.
  let words: DictionaryWord[] = [];
  let loadFailed = false;
  try {
    words = await fetchAllDictionaryWords();
  } catch {
    loadFailed = true;
  }

  return (
    <PageContainer>
      <DictionaryBrowser
        words={words}
        loadFailed={loadFailed}
        initialQuery={firstParam(query.q)}
        initialTab={firstParam(query.tab) === "words" ? "word" : "character"}
        initialCategory={firstParam(query.cat)}
      />
    </PageContainer>
  );
}
