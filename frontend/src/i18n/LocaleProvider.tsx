"use client";

import { ReactNode, useEffect, useMemo, useRef } from "react";

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

  // Tracks whether the store has been synced to the current route yet. Until then,
  // the store's in-memory default ('kh') isn't trustworthy for the first paint —
  // only the route (known synchronously from the server-rendered URL segment) is.
  const hasSyncedRef = useRef(false);

  // Sync route → store only when the URL locale segment actually changes (Next.js
  // navigation). Intentionally excludes storeLocale from deps so that a user-initiated
  // locale switch (which updates the store but NOT the route prop) does NOT trigger
  // a reverse sync that would override the user's choice.
  useEffect(() => {
    if (routeLocale) {
      setLocale(routeLocale);
    }
    hasSyncedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocale]);

  useEffect(() => {
    document.documentElement.lang = storeLocale;
  }, [storeLocale]);

  // Before the sync effect has run (SSR + first paint), trust the route so the page
  // renders in the correct locale immediately instead of flashing the store's default.
  // After that, the store is the source of truth so a locale switch via the UI button
  // (which updates the store but not the route prop) is reflected immediately.
  const value = hasSyncedRef.current ? storeLocale : routeLocale ?? storeLocale;

  return (
    <LocaleContextProvider value={value}>{children}</LocaleContextProvider>
  );
}
