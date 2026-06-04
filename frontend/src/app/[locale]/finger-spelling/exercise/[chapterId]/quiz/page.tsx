import { notFound } from "next/navigation";
import { QuizShell } from "@/features/finger-spelling/components";

type PageProps = {
  params: Promise<{ chapterId: string }>;
};

export default async function ChapterExerciseQuizPage({ params }: PageProps) {
  const { chapterId } = await params;
  const id = Number(chapterId);
  if (Number.isNaN(id)) notFound();

  return <QuizShell chapterId={id} />;
}
