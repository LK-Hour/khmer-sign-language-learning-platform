"use client";

import CurriculumCard from "@/components/curriculum/CurriculumCard";
import { ROUTES } from "@/constants/routes";
import { formatUnitBadge } from "@/features/finger-spelling/utils/chapter";
import { useLocalizedPair } from "@/i18n/useLocalizedPair";
import { useTranslation } from "@/i18n/useTranslation";
import type { FsUnit } from "../../types";

type UnitCardProps = {
  unit: FsUnit;
};

export default function UnitCard({ unit }: UnitCardProps) {
  const { t, locale } = useTranslation();
  const { primary, secondary } = useLocalizedPair(unit.title, unit.titleKh);
  const progressPercent =
    unit.totalLessonCount > 0
      ? Math.round((unit.completedLessonCount / unit.totalLessonCount) * 100)
      : 0;

  const locked = unit.isLocked === true;

  return (
    <CurriculumCard
      href={locked ? undefined : ROUTES.fingerSpelling.unit(unit.id)}
      badgeLabel={formatUnitBadge(unit.orderIndex, locale, t("fsUnit"))}
      title={primary}
      subtitle={secondary}
      progressText={`${unit.completedLessonCount} of ${unit.totalLessonCount} lessons completed`}
      progressPercent={progressPercent}
      locked={locked}
    />
  );
}
