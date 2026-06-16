import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout";
import {
  fetchFsChapter,
  fetchFsLesson,
  fetchFsLessons,
  fetchFsUnit,
} from "@/features/finger-spelling/api/curriculum";
import { LessonLearningView } from "@/features/finger-spelling/components";
import { getNextLessonInChapter } from "@/features/finger-spelling/utils/progress";
import LessonLockedView from "@/features/finger-spelling/components/learning/LessonLockedView";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonDetailPage({ params }: PageProps) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  if (Number.isNaN(id)) notFound();

  const lesson = await fetchFsLesson(id);
  if (!lesson) notFound();

  // Guard: prevent users from accessing locked lessons via URL manipulation
  if (lesson.isLocked) {
    return (
      <PageContainer>
        <LessonLockedView />
      </PageContainer>
    );
  }

  const [chapterLessons, chapter] = await Promise.all([
    fetchFsLessons(lesson.chapterId),
    fetchFsChapter(lesson.chapterId),
  ]);
  if (!chapter) notFound();

  const unit = await fetchFsUnit(chapter.unitId);
  if (!unit) notFound();

  const nextLesson = getNextLessonInChapter(chapterLessons, lesson.id);

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <LessonLearningView
        lesson={lesson}
        unit={unit}
        chapter={chapter}
        nextLessonId={nextLesson?.id}
      />
    </PageContainer>
  );
}