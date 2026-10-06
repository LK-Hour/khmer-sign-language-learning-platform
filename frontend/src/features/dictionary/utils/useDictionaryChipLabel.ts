"use client";

import { useMemo } from "react";

import { useTranslation } from "@/i18n/useTranslation";

import type { DictionaryWord } from "../types";
import { getDictionaryChipKey } from "./categoryLabel";

export function useDictionaryChipLabel(word: DictionaryWord): string {
  const { t } = useTranslation();

  return useMemo(() => t(getDictionaryChipKey(word)), [t, word]);
}
