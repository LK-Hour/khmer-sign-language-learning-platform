"use client";

import { ReactNode, useEffect, useMemo } from "react";

import { useLocaleStore } from "@/store/locale.store";

import { isValidLocale, type Locale } from "./config";
import { LocaleContextProvider } from "./locale-context";

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: string;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const storeLocale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const routeLocale = useMemo<Locale | null>(
    () => (isValidLocale(initialLocale) ? initialLocale : null),
    [initialLocale],
  );

  // URL segment wins on first render; store catches up after hydration.
  const locale = routeLocale ?? storeLocale;

  useEffect(() => {
    if (routeLocale && storeLocale !== routeLocale) {
      setLocale(routeLocale);
    }
  }, [routeLocale, storeLocale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContextProvider value={locale}>{children}</LocaleContextProvider>
  );
}
