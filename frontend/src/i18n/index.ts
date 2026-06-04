// Main exports for i18n module
export { useLocaleStore } from './localeStore';
export { useTranslation } from './useTranslation';
export { useLocalizedPair } from './useLocalizedPair';
export { getLocalizedPair } from './localizedText';
export type { LocalizedPair } from './localizedText';
export { LocaleProvider } from './LocaleProvider';
export { getTranslations, t } from './translations';
export { 
  SUPPORTED_LOCALES, 
  DEFAULT_LOCALE, 
  LOCALE_NAMES,
  LOCALE_FULL_NAMES,
  isValidLocale,
  getPreferredLocale,
  type Locale,
} from './config';
