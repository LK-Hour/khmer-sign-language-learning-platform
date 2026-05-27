import { notFound } from "next/navigation";
import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import LessonDetailView from "@/features/finger-spelling/components/LessonDetailView";
import {
  fetchFsLesson,
  fetchFsLessons,
} from "@/features/finger-spelling/api/curriculum";
import { ROUTES } from "@/constants/routes";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonDetailPage({ params }: PageProps) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  if (Number.isNaN(id)) notFound();

  const lesson = await fetchFsLesson(id);
  if (!lesson || lesson.isLocked) notFound();

  const chapterLessons = await fetchFsLessons(lesson.chapterId);
  const currentIndex = chapterLessons.findIndex((l) => l.id === lesson.id);
  const nextLesson =
    currentIndex >= 0 ? chapterLessons[currentIndex + 1] : undefined;
  const nextLessonId =
    nextLesson && !nextLesson.isLocked ? nextLesson.id : undefined;

  return (
    <FsMobileShell
      title="Lesson"
      subtitle={lesson.letter}
      showBack
      backHref={ROUTES.fingerSpelling.chapter(lesson.chapterId)}
      hideBottomNav
    >
      <LessonDetailView
        lesson={lesson}
        chapterId={lesson.chapterId}
        nextLessonId={nextLessonId}
      />
    </FsMobileShell>
  );
}
