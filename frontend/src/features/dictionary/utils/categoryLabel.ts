import type { TranslationKey } from "@/i18n/translations";

import type { DictionaryWord } from "../types";

/** Maps backend unit `category` (English name) to i18n label keys. */
const UNIT_CATEGORY_KEYS: Record<string, TranslationKey> = {
  Numbers: "DICTIONARY.CATEGORY.NUMBERS",
  "Main Consonants": "DICTIONARY.CATEGORY.CONSONANT",
  "Sub Consonants": "DICTIONARY.CATEGORY.SUB_CONSONANT",
  "Dependent Vowels": "DICTIONARY.CATEGORY.VOWEL",
  "Independent Vowels": "DICTIONARY.CATEGORY.INDEPENDENT_VOWEL",
  Diacritics: "DICTIONARY.CATEGORY.DIACRITICS",
  Education: "DICTIONARY.CATEGORY.EDUCATION",
  "Directions and Places": "DICTIONARY.CATEGORY.DIRECTIONS_AND_PLACES",
  Time: "DICTIONARY.CATEGORY.TIME",
  "Pronouns and Nouns": "DICTIONARY.CATEGORY.PRONOUNS_AND_NOUNS",
  "Daily Activities": "DICTIONARY.CATEGORY.DAILY_ACTIVITIES",
  "Food and Drinks": "DICTIONARY.CATEGORY.FOOD_AND_DRINKS",
  "Household Items": "DICTIONARY.CATEGORY.HOUSEHOLD_ITEMS",
  Vehicles: "DICTIONARY.CATEGORY.VEHICLES",
  Sports: "DICTIONARY.CATEGORY.SPORTS",
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

  return word.entryType === "word"
    ? "DICTIONARY.LIST.TYPE_WORD"
    : "DICTIONARY.LIST.TYPE_CHARACTER";
}
