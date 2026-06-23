"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useLocaleStore } from "@/store/locale.store";

import { DEFAULT_LOCALE, type Locale } from "./config";

const LocaleContext = createContext<Locale | null>(null);

type LocaleContextProviderProps = {
  children: ReactNode;
  value: Locale;
};

export function LocaleContextProvider({
  children,
  value,
}: LocaleContextProviderProps) {
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/** Route-aware locale. Prefer this over reading the store directly. */
export function useLocale(): Locale {
  const routeLocale = useContext(LocaleContext);
  const storeLocale = useLocaleStore((state) => state.locale);
  return routeLocale ?? storeLocale;
}

export function useSetLocale() {
  return useLocaleStore((state) => state.setLocale);
}

export function useToggleLocale() {
  return useLocaleStore((state) => state.toggleLocale);
}
