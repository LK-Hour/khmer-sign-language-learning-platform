import CurriculumCard from "@/components/curriculum/CurriculumCard";
import { ROUTES } from "@/constants/routes";
import type { FsLesson } from "../../types";

type LessonCardProps = {
  lesson: FsLesson;
};

export default function LessonCard({ lesson }: LessonCardProps) {
  const progressPercent =
    lesson.progressStatus === "COMPLETED"
      ? 100
      : lesson.progressStatus === "IN_PROGRESS"
        ? 50
        : 0;

  return (
    <CurriculumCard
      href={
        lesson.isLocked
          ? undefined
          : ROUTES.fingerSpelling.lesson(lesson.id)
      }
      badgeLabel={`Lesson ${lesson.orderIndex}`}
      title={lesson.letter}
      subtitle={lesson.romanization ?? lesson.letterNameKh ?? undefined}
      progressText={
        lesson.progressStatus === "COMPLETED"
          ? "100%"
          : lesson.progressStatus === "IN_PROGRESS"
            ? "50%"
            : "0%"
      }
      progressPercent={progressPercent}
      locked={lesson.isLocked}
    />
  );
}
