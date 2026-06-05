'use client';

import { ReactNode, useEffect } from 'react';
import { isValidLocale } from './config';
import { useLocaleStore } from './localeStore';

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: string;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  useEffect(() => {
    if (initialLocale && isValidLocale(initialLocale)) {
      setLocale(initialLocale);
    }
  }, [initialLocale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return children;
}
