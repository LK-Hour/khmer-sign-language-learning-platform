"use client";

import { useMemo } from "react";
import { getLocalizedPair } from "./localizedText";
import { useTranslation } from "./useTranslation";

export function useLocalizedPair(en: string, kh?: string | null) {
  const { locale } = useTranslation();

  return useMemo(
    () => getLocalizedPair(locale, en, kh),
    [locale, en, kh]
  );
}
