'use client';

import { useCallback } from 'react';
import { useLocaleStore } from './localeStore';
import { t } from './translations';

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const translate = useCallback((key: string) => t(locale, key), [locale]);

  return {
    locale,
    t: translate,
  };
}
