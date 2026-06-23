'use client';

import { useCallback } from 'react';

import { useLocale } from './locale-context';
import { t, type TranslationKey } from './translations';

type TranslationValues = Record<string, string | number>;

export function useTranslation() {
  const locale = useLocale();
  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(locale, key, values),
    [locale]
  );

  return {
    locale,
    t: translate,
  };
}
