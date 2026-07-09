import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout";
import { ChapterPracticeContainer } from "@/features/word-detection/components/practice";

type PageProps = {
  params: Promise<{ locale: string; chapterId: string }>;
};

export default async function WordDetectionChapterPracticePage({ params }: PageProps) {
  const { chapterId } = await params;
  const id = Number(chapterId);
  if (Number.isNaN(id)) notFound();

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <ChapterPracticeContainer chapterId={id} />
    </PageContainer>
  );
}
