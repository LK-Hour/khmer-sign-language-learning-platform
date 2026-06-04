"use client";

import { getLocalizedPair } from "@/i18n/localizedText";
import { getTranslations } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import FingerSpellingShell from "./FingerSpellingShell";

type FingerSpellingProfileShellProps = {
  children: React.ReactNode;
};

export default function FingerSpellingProfileShell({
  children,
}: FingerSpellingProfileShellProps) {
  const { locale } = useTranslation();
  const en = getTranslations("en");
  const kh = getTranslations("kh");

  const header = getLocalizedPair(locale, en.fsProfileTitle, kh.fsProfileTitle);
  const subtitle = getLocalizedPair(
    locale,
    en.fsProfileSubtitle,
    kh.fsProfileSubtitle
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
