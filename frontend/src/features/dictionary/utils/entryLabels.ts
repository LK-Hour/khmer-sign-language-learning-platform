import { getLocalizedPair, type LocalizedPair } from "@/i18n/localizedText";
import type { Locale } from "@/i18n/config";

import type { DictionaryEntryType } from "../types";

/** Characters always lead with Khmer; words follow the active locale. */
export function getDictionaryEntryLabels(
  locale: Locale,
  textEn: string,
  textKh: string | null | undefined,
  entryType: DictionaryEntryType = "character"
): LocalizedPair {
  const english = textEn.trim();
  const khmer = (textKh ?? "").trim();

  if (entryType === "character") {
    const primary = khmer || english;
    const secondary =
      khmer && english && khmer !== english ? english : undefined;
    return { primary, secondary };
  }

  return getLocalizedPair(locale, textEn, textKh);
}
