import type { Locale } from "./config";
import enTranslations from "./locales/en.json";
import khTranslations from "./locales/kh.json";

type TranslationValues = Record<string, string | number>;

const translations = {
  en: enTranslations,
  kh: khTranslations,
} as const satisfies Record<Locale, Record<string, string>>;

export type TranslationKey = keyof typeof enTranslations;
export type Translations = Record<TranslationKey, string>;

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.kh;
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value == null ? match : String(value);
  });
}

export function t(
  locale: Locale,
  key: TranslationKey,
  values?: TranslationValues
): string {
  const messages = getTranslations(locale);
  return interpolate(messages[key] || key, values);
}
