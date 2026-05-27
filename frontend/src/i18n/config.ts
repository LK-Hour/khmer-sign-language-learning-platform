// i18n Configuration
// Defines supported locales and default settings

export const SUPPORTED_LOCALES = ['kh', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'kh'; // Khmer as default

export const LOCALE_NAMES: Record<Locale, string> = {
  kh: 'ខ្មែរ',
  en: 'English',
};

export const LOCALE_FULL_NAMES: Record<Locale, string> = {
  kh: 'Khmer',
  en: 'English',
};

// Validate if a locale is supported
export function isValidLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && SUPPORTED_LOCALES.includes(locale as Locale);
}

// Get browser's preferred locale
export function getPreferredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const browserLang = navigator.language.split('-')[0];
  return isValidLocale(browserLang) ? browserLang : DEFAULT_LOCALE;
}
