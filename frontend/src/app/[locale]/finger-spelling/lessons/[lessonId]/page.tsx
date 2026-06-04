import { notFound } from "next/navigation";
import {
  fetchFsChapter,
  fetchFsLesson,
  fetchFsLessons,
} from "@/features/finger-spelling/api/curriculum";
import {
  FingerSpellingShell,
  LessonLearningView,
} from "@/features/finger-spelling/components";
import { getNextLessonInChapter } from "@/features/finger-spelling/utils/progress";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonDetailPage({ params }: PageProps) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  if (Number.isNaN(id)) notFound();

  const lesson = await fetchFsLesson(id);
  if (!lesson) notFound();

  const [chapterLessons, chapter] = await Promise.all([
    fetchFsLessons(lesson.chapterId),
    fetchFsChapter(lesson.chapterId),
  ]);
  if (!chapter) notFound();
  const sortedLessons = [...chapterLessons].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );
  const currentIndex = sortedLessons.findIndex((l) => l.id === lesson.id);
  const nextLesson = getNextLessonInChapter(chapterLessons, lesson.id);
  const nextLessonId = nextLesson?.id;

  return (
    <FingerSpellingShell
      title={`Lesson ${lesson.orderIndex}`}
      subtitle="learn basic finger spelling with AI-powered"
      headerVariant="lesson"
      hideBottomNav
      fullWidth
    >
      <LessonLearningView
        lesson={lesson}
        chapterId={lesson.chapterId}
        unitId={chapter.unitId}
        nextLessonId={nextLessonId}
        lessonIndex={currentIndex >= 0 ? currentIndex : 0}
        totalLessons={chapterLessons.length}
      />
    </FingerSpellingShell>
  );
}
