import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout";
import { ROUTES } from "@/constants/routes";
import {
  fetchAllDictionaryWords,
  fetchDictionaryWord,
} from "@/features/dictionary/api/dictionary";
import { DictionaryWordDetail } from "@/features/dictionary/components";
import { getDictionaryDescription, getDictionaryNeighbors } from "@/features/dictionary/utils/dictionaryList";
import { isValidLocale } from "@/i18n/config";
import { t } from "@/i18n/translations";
import { absoluteUrl, buildLanguageAlternates, DEFAULT_OG_IMAGE } from "@/lib/seo/config";
import JsonLd from "@/lib/seo/JsonLd";
import { dictionaryWordJsonLd } from "@/lib/seo/structuredData";

type PageProps = {
  params: Promise<{ locale: string; wordId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, wordId } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : "kh";
  const id = Number(wordId);

  if (Number.isNaN(id)) {
    return { title: t(locale, "DICTIONARY.LIST.NO_RESULTS_TITLE") };
  }

  const word = await fetchDictionaryWord(id);
  if (!word) {
    return { title: t(locale, "DICTIONARY.LIST.NO_RESULTS_TITLE") };
  }

  const displayName = locale === "kh" ? word.textKh : word.textEn;
  const typeLabel =
    word.entryType === "word"
      ? t(locale, "DICTIONARY.LIST.TYPE_WORD")
      : t(locale, "DICTIONARY.LIST.TYPE_CHARACTER");
  const title = `${displayName} · ${typeLabel}`;
  const description =
    getDictionaryDescription(word) ?? t(locale, "DICTIONARY.LIST.SUBHEADLINE");
  const url = absoluteUrl(`/${locale}${ROUTES.dictionaryWord(word.id)}`);
  const image = word.mediaUrl ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(ROUTES.dictionaryWord(word.id)),
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [{ url: image, alt: displayName }],
    },
    twitter: {
      title,
      description,
      images: [image],
    },
  };
}

export default async function DictionaryWordPage({ params }: PageProps) {
  const { locale: rawLocale, wordId } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : "kh";
  const id = Number(wordId);
  if (Number.isNaN(id)) notFound();

  const [word, allWords] = await Promise.all([
    fetchDictionaryWord(id),
    fetchAllDictionaryWords().catch(() => []),
  ]);
  if (!word) notFound();

  const { previous, next, siblings } = getDictionaryNeighbors(allWords, word);

  return (
    <PageContainer>
      <JsonLd data={dictionaryWordJsonLd(word, locale)} />
      <DictionaryWordDetail word={word} previous={previous} next={next} siblings={siblings} />
    </PageContainer>
  );
}
