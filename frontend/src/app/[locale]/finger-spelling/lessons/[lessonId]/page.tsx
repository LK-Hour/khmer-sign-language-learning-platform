import { notFound } from "next/navigation";
import LostDatabaseConnectionView from "@/components/LostDatabaseConnectionView";
import { PageContainer } from "@/components/layout";
import {
  fetchFsChapter,
  fetchFsLesson,
  fetchFsLessons,
  fetchFsUnit,
} from "@/features/finger-spelling/api/curriculum";
import {
  FingerSpellingLessonAccessGuard,
  FingerSpellingLessonLearningView,
} from "@/features/finger-spelling/components";
import { getNextLessonInChapter } from "@/features/shared/trackProgress";
import { isServiceUnavailable } from "@/utils/api/client";
import LessonDetailLoading from "./loading";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

async function loadLessonPage(id: number) {
  const lesson = await fetchFsLesson(id);
  if (!lesson) notFound();

  const [chapterLessons, chapter] = await Promise.all([
    fetchFsLessons(lesson?.chapterId),
    fetchFsChapter(lesson?.chapterId),
  ]);
  if (!chapter) notFound();

  const unit = await fetchFsUnit(chapter?.unitId);
  if (!unit) notFound();

  const nextLesson = getNextLessonInChapter(chapterLessons, lesson?.id);
  return { lesson, chapter, unit, nextLesson };
}

export default async function LessonDetailPage({ params }: PageProps) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  if (Number.isNaN(id)) notFound();

  let data: Awaited<ReturnType<typeof loadLessonPage>>;
  try {
    data = await loadLessonPage(id);
  } catch (err) {
    if (isServiceUnavailable(err)) return <LostDatabaseConnectionView />;
    throw err;
  }
  const { lesson, chapter, unit, nextLesson } = data;

  return (
    <FingerSpellingLessonAccessGuard
      lessonId={lesson.id}
      fallback={<LessonDetailLoading />}
    >
      <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
        <FingerSpellingLessonLearningView
          lesson={lesson}
          unit={unit}
          chapter={chapter}
          nextLessonId={nextLesson?.id}
        />
      </PageContainer>
    </FingerSpellingLessonAccessGuard>
  );
}
