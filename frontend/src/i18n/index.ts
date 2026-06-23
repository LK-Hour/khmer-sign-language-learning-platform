// Main exports for i18n module
export { useLocaleStore } from '@/store/locale.store';
export { useTranslation } from './useTranslation';
export { useLocale, useSetLocale, useToggleLocale } from './locale-context';
export { useLocalizedPair } from './useLocalizedPair';
export { getLocalizedPair } from './localizedText';
export type { LocalizedPair } from './localizedText';
export { LocaleProvider } from './LocaleProvider';
export { getTranslations, t } from './translations';
export type { TranslationKey, Translations } from './translations';
export { 
  SUPPORTED_LOCALES, 
  DEFAULT_LOCALE, 
  LOCALE_NAMES,
  LOCALE_FULL_NAMES,
  isValidLocale,
  getPreferredLocale,
  type Locale,
} from './config';
