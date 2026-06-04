import type { Locale } from "./config";

export type LocalizedPair = {
  primary: string;
  secondary?: string;
};

/** Pick primary/secondary labels from EN + KH fields based on active locale. */
export function getLocalizedPair(
  locale: Locale,
  en: string,
  kh?: string | null
): LocalizedPair {
  const english = en.trim();
  const khmer = (kh ?? "").trim();

  if (locale === "kh") {
    const primary = khmer || english;
    const secondary =
      khmer && english && khmer !== english ? english : undefined;
    return { primary, secondary };
  }

  const primary = english || khmer;
  const secondary =
    khmer && english && khmer !== english ? khmer : undefined;
  return { primary, secondary };
}
