import type { MetadataRoute } from "next";
import { fetchAllDictionaryWords } from "@/features/dictionary/api/dictionary";
import { ROUTES } from "@/constants/routes";
import { absoluteUrl, INDEXABLE_LOCALES } from "@/lib/seo/config";

/** Revalidate the sitemap at most once per hour. */
export const revalidate = 3600;

function localizedEntries(
  path: string,
  overrides: Partial<MetadataRoute.Sitemap[number]> = {},
): MetadataRoute.Sitemap {
  return INDEXABLE_LOCALES.map((locale) => ({
    url: absoluteUrl(`/${locale}${path}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
    ...overrides,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    ...localizedEntries("", { priority: 1, changeFrequency: "daily" }),
    ...localizedEntries(ROUTES.dictionary, { priority: 0.8, changeFrequency: "daily" }),
  ];

  let wordEntries: MetadataRoute.Sitemap = [];
  try {
    const words = await fetchAllDictionaryWords();
    wordEntries = words.flatMap((word) =>
      localizedEntries(ROUTES.dictionaryWord(word.id), {
        priority: 0.6,
        changeFrequency: "monthly",
      }),
    );
  } catch {
    // If the backend is unreachable at build/request time, still ship the
    // static routes rather than failing the whole sitemap.
  }

  return [...staticEntries, ...wordEntries];
}
