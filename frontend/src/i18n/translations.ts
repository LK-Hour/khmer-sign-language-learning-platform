import type { Locale } from "./config";
import enTranslations from "./locales/en.json";
import khTranslations from "./locales/kh.json";

type TranslationValues = Record<string, string | number>;

const translations = {
  en: enTranslations,
  kh: khTranslations,
} as const;

type LeafPaths<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : T extends object
    ? {
        [K in keyof T & string]: LeafPaths<
          T[K],
          Prefix extends "" ? K : `${Prefix}.${K}`
        >;
      }[keyof T & string]
    : never;

export type TranslationKey = LeafPaths<typeof enTranslations>;
export type Translations = typeof enTranslations;

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.kh;
}

function resolveMessage(
  messages: Translations,
  key: string
): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
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
  const template = resolveMessage(messages, key) ?? key;
  return interpolate(template, values);
}
