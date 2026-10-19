import { notFound } from "next/navigation";
import LostDatabaseConnectionView from "@/components/LostDatabaseConnectionView";
import { PageContainer } from "@/components/layout";
import { fetchWdLessonLearning } from "@/features/word-detection/api/curriculum";
import { WordDetectionLessonLearningView } from "@/features/word-detection/components";
import { isServiceUnavailable } from "@/utils/api/client";

type PageProps = {
  params: Promise<{ locale: string; lessonId: string }>;
};

export default async function WordDetectionLessonPage({ params }: PageProps) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  if (Number.isNaN(id)) notFound();

  let data: Awaited<ReturnType<typeof fetchWdLessonLearning>>;
  try {
    data = await fetchWdLessonLearning(id);
  } catch (err) {
    if (isServiceUnavailable(err)) return <LostDatabaseConnectionView />;
    throw err;
  }
  if (!data) notFound();
  const { lesson, chapter, unit, nextLessonId } = data;

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <WordDetectionLessonLearningView
        key={lesson.id}
        lesson={lesson}
        unit={unit}
        chapter={chapter}
        nextLessonId={nextLessonId ?? undefined}
      />
    </PageContainer>
  );
}
