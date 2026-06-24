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

  // Sync route → store only when the URL locale segment actually changes (Next.js
  // navigation). Intentionally excludes storeLocale from deps so that a user-initiated
  // locale switch (which updates the store but NOT the route prop) does NOT trigger
  // a reverse sync that would override the user's choice.
  useEffect(() => {
    if (routeLocale) {
      setLocale(routeLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocale]);

  useEffect(() => {
    document.documentElement.lang = storeLocale;
  }, [storeLocale]);

  // Store is the source of truth for the context value so that a locale switch via
  // the UI button is reflected immediately without a page navigation/re-fetch.
  // The effect above keeps the store in sync with the URL on navigation.
  return (
    <LocaleContextProvider value={storeLocale}>{children}</LocaleContextProvider>
  );
}
