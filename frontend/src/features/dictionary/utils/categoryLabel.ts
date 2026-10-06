import type { TranslationKey } from "@/i18n/translations";

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

/** Localized unit label, falling back to the raw backend name. */
export function getDictionaryCategoryLabel(
  category: string | null | undefined,
  translate: (key: TranslationKey) => string,
): string {
  if (!category) return "";
  const key = UNIT_CATEGORY_KEYS[category];
  return key ? translate(key) : category;
}
