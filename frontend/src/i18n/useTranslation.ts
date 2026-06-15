'use client';

import { useCallback } from 'react';
import { useLocaleStore } from '@/store/locale.store';
import { t, type TranslationKey } from './translations';

type TranslationValues = Record<string, string | number>;

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const translate = useCallback(
    (key: TranslationKey, values?: TranslationValues) => t(locale, key, values),
    [locale]
  );

  return {
    locale,
    t: translate,
  };
}
