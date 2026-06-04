"use client";

import CurriculumCard from "@/components/curriculum/CurriculumCard";
import { ROUTES } from "@/constants/routes";
import { useLocalizedPair } from "@/i18n/useLocalizedPair";
import type { FsChapter } from "../../types";

type ChapterCardProps = {
  chapter: FsChapter;
};

export default function ChapterCard({ chapter }: ChapterCardProps) {
  const { primary, secondary } = useLocalizedPair(chapter.title, chapter.titleKh);
  const progressPercent =
    chapter.lessonCount > 0
      ? Math.round((chapter.completedLessonCount / chapter.lessonCount) * 100)
      : 0;

  const locked =
    chapter.completedLessonCount === 0 && chapter.orderIndex > 1;

  return (
    <CurriculumCard
      href={
        locked
          ? undefined
          : ROUTES.fingerSpelling.unitChapter(chapter.unitId, chapter.id)
      }
      badgeLabel={`Chapter ${chapter.orderIndex}`}
      title={primary}
      subtitle={secondary}
      progressText={`${chapter.completedLessonCount}/${chapter.lessonCount} lessons completed`}
      progressPercent={progressPercent}
      locked={locked}
    />
  );
}
