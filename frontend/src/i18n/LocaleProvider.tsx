"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { isValidLocale, type Locale } from "./config";
import { useLocaleStore } from "@/store/locale.store";

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: string;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const routeLocale = useMemo<Locale | null>(
    () => (isValidLocale(initialLocale) ? initialLocale : null),
    [initialLocale],
  );
  const effectiveLocale = routeLocale ?? locale;

  useEffect(() => {
    if (routeLocale && locale !== routeLocale) {
      setLocale(routeLocale);
    }
  }, [locale, routeLocale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = effectiveLocale;
  }, [effectiveLocale]);

  return children;
}
