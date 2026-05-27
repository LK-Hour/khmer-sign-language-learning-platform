'use client';

import { useLocaleStore } from './localeStore';
import { t } from './translations';

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);

  return {
    locale,
    t: (key: string) => t(locale, key),
  };
}
