'use client';

import { useCallback } from 'react';

import type { Locale } from './config';
import { useLocale } from './locale-context';
import { t, type TranslationKey } from './translations';

function joinEntityLabel(locale: Locale, verb: string, entity: string): string {
  return locale === 'kh' ? `${verb}${entity}` : `${verb} ${entity}`;
}

function joinQuotedSuffix(name: string, suffix: string): string {
  return `"${name}" ${suffix}`;
}

export function useTranslation() {
  const locale = useLocale();
  const translate = useCallback(
    (key: TranslationKey) => t(locale, key),
    [locale]
  );

  const entityActionLabel = useCallback(
    (verbKey: TranslationKey, entity: string) =>
      joinEntityLabel(locale, translate(verbKey), entity),
    [locale, translate]
  );

  const quotedConfirmMessage = useCallback(
    (name: string, suffixKey: TranslationKey) =>
      joinQuotedSuffix(name, translate(suffixKey)),
    [translate]
  );

  return {
    locale,
    t: translate,
    entityActionLabel,
    quotedConfirmMessage,
  };
}
