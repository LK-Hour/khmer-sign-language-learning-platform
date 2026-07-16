import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout";
import {
  fetchWdChapter,
  fetchWdLesson,
  fetchWdLessons,
  fetchWdUnit,
} from "@/features/word-detection/api/curriculum";
import { getNextLessonInChapter } from "@/features/word-detection/utils/progress";
import { WordDetectionLessonLearningView } from "@/features/word-detection/components";

type PageProps = {
  params: Promise<{ locale: string; lessonId: string }>;
};

export default async function WordDetectionLessonPage({ params }: PageProps) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  if (Number.isNaN(id)) notFound();

  const lesson = await fetchWdLesson(id);
  if (!lesson) notFound();

  const [chapterLessons, chapter] = await Promise.all([
    fetchWdLessons(lesson.chapterId),
    fetchWdChapter(lesson.chapterId),
  ]);
  if (!chapter) notFound();

  const unit = await fetchWdUnit(chapter.unitId);
  if (!unit) notFound();

  const nextLesson = getNextLessonInChapter(chapterLessons, lesson.id);

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <WordDetectionLessonLearningView
        lesson={lesson}
        unit={unit}
        chapter={chapter}
        nextLessonId={nextLesson?.id}
      />
    </PageContainer>
  );
}
