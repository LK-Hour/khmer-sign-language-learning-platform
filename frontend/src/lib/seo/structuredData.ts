import type { DictionaryWord } from "@/features/dictionary/types";
import { ROUTES } from "@/constants/routes";
import type { JsonLdData } from "./JsonLd";
import { absoluteUrl, SITE_NAME, SITE_URL } from "./config";

/**
 * Site-wide identity + search box. Emitted on the landing page so Google can
 * associate the domain with the platform name and enable a sitelinks search.
 */
export function websiteJsonLd(locale: string): JsonLdData {
  const home = absoluteUrl(`/${locale}`);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: home,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl(`/${locale}${ROUTES.dictionary}`)}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Publisher/organization behind the platform. */
export function organizationJsonLd(): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/**
 * A single dictionary entry described as a DefinedTerm within the KSL
 * glossary. Helps the entry surface for sign/word lookups.
 */
export function dictionaryWordJsonLd(
  word: DictionaryWord,
  locale: string,
): JsonLdData {
  const url = absoluteUrl(`/${locale}${ROUTES.dictionaryWord(word.id)}`);
  const data: JsonLdData = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: locale === "kh" ? word.textKh : word.textEn,
    url,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: SITE_NAME,
      url: absoluteUrl(`/${locale}${ROUTES.dictionary}`),
    },
  };

  if (word.description?.trim()) {
    data.description = word.description.trim();
  }
  if (word.mediaUrl) {
    data.image = word.mediaUrl;
  }

  return data;
}
