"use client";

import { getLocalizedPair } from "@/i18n/localizedText";
import { getTranslations } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import FingerSpellingShell from "./FingerSpellingShell";

type FingerSpellingHomeShellProps = {
  children: React.ReactNode;
};

export default function FingerSpellingHomeShell({
  children,
}: FingerSpellingHomeShellProps) {
  const { locale } = useTranslation();
  const en = getTranslations("en");
  const kh = getTranslations("kh");
  const header = getLocalizedPair(locale, en.fsHomeTitle, kh.fsHomeTitle);
  const sub = getLocalizedPair(locale, en.fsHomeSubtitle, kh.fsHomeSubtitle);

  return (
    <FingerSpellingShell
      title={header.primary}
      subtitle={sub.primary}
    >
      {children}
    </FingerSpellingShell>
  );
}
