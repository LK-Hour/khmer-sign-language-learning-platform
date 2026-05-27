// Main exports for i18n module
export { useLocaleStore } from './localeStore';
export { useTranslation } from './useTranslation';
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
