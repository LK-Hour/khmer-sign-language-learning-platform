'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useLocaleStore } from './localeStore';

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: string;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [mounted, setMounted] = useState(false);
  const setLocale = useLocaleStore((state) => state.setLocale);

  useEffect(() => {
    setMounted(true);
    
    // Set initial locale if provided (from middleware or URL)
    if (initialLocale) {
      setLocale(initialLocale as any);
    }
  }, [initialLocale, setLocale]);

  if (!mounted) {
    return children;
  }

  return children;
}
