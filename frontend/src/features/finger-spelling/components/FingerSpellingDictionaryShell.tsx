"use client";

import { getLocalizedPair } from "@/i18n/localizedText";
import { getTranslations } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import FingerSpellingShell from "./FingerSpellingShell";

type FingerSpellingDictionaryShellProps = {
  children: React.ReactNode;
};

export default function FingerSpellingDictionaryShell({
  children,
}: FingerSpellingDictionaryShellProps) {
  const { locale } = useTranslation();
  const en = getTranslations("en");
  const kh = getTranslations("kh");

  const header = getLocalizedPair(
    locale,
    en.fsDictionaryTitle,
    kh.fsDictionaryTitle
  );
  const subtitle = getLocalizedPair(
    locale,
    en.fsDictionarySubtitle,
    kh.fsDictionarySubtitle
  );

  return (
    <FingerSpellingShell
      title={header.primary}
      subtitle={subtitle.primary}
    >
      {children}
    </FingerSpellingShell>
  );
}
