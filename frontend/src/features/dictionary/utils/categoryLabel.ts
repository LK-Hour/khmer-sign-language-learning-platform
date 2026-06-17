import type { TranslationKey } from "@/i18n/translations";

import type { DictionaryWord } from "../types";

/** Maps backend unit `category` (English name) to i18n label keys. */
const UNIT_CATEGORY_KEYS: Record<string, TranslationKey> = {
  Numbers: "dictCategoryNumbers",
  "Main Consonants": "dictCategoryConsonant",
  "Sub Consonants": "dictCategorySubConsonant",
  "Dependent Vowels": "dictCategoryVowel",
  "Independent Vowels": "dictCategoryIndependentVowel",
  Diacritics: "dictCategoryDiacritics",
};

export function getDictionaryCategoryKey(
  word: DictionaryWord
): TranslationKey | null {
  if (!word.category) return null;
  return UNIT_CATEGORY_KEYS[word.category] ?? null;
}

export function getDictionaryChipKey(word: DictionaryWord): TranslationKey {
  const categoryKey = getDictionaryCategoryKey(word);
  if (categoryKey) return categoryKey;

  const entryType = word.entryType ?? "character";
  return entryType === "word" ? "dictTypeWord" : "dictTypeCharacter";
}
