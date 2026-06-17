"use client";

import { useMemo } from "react";

import { useTranslation } from "@/i18n/useTranslation";

import type { DictionaryEntryType, DictionaryWord } from "../types";
import { getDictionaryEntryLabels } from "./entryLabels";

export function useDictionaryEntryLabels(
  textEn: string,
  textKh: string | null | undefined,
  entryType: DictionaryEntryType = "character"
) {
  const { locale } = useTranslation();

  return useMemo(
    () => getDictionaryEntryLabels(locale, textEn, textKh, entryType),
    [locale, textEn, textKh, entryType]
  );
}

export function useDictionaryWordLabels(word: DictionaryWord) {
  const entryType = word.entryType ?? "character";
  return useDictionaryEntryLabels(word.textEn, word.textKh, entryType);
}
