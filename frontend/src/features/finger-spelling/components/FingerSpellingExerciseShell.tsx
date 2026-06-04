"use client";

import { getLocalizedPair } from "@/i18n/localizedText";
import { getTranslations } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import FingerSpellingShell from "./FingerSpellingShell";

type FingerSpellingExerciseShellProps = {
  children: React.ReactNode;
};

export default function FingerSpellingExerciseShell({
  children,
}: FingerSpellingExerciseShellProps) {
  const { t, locale } = useTranslation();
  const en = getTranslations("en");
  const kh = getTranslations("kh");

  const header = getLocalizedPair(locale, en.fsExerciseTitle, kh.fsExerciseTitle);
  const subtitle = getLocalizedPair(
    locale,
    en.fsExerciseSubtitle,
    kh.fsExerciseSubtitle
  );
  const context = getLocalizedPair(
    locale,
    en.fsExerciseContextTitle,
    kh.fsExerciseContextTitle
  );
  const contextSub = getLocalizedPair(
    locale,
    en.fsExerciseContextSubtitle,
    kh.fsExerciseContextSubtitle
  );

  return (
    <FingerSpellingShell
      title={header.primary}
      subtitle={subtitle.primary}
      contextBadge={t("fsExerciseTitle")}
      contextTitle={context.primary}
      contextSubtitle={contextSub.primary}
    >
      {children}
    </FingerSpellingShell>
  );
}
