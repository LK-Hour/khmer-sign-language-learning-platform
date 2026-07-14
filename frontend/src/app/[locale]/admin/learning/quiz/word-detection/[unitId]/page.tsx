import { notFound } from "next/navigation";

import UnitQuizPage from "@/features/admin/quiz/UnitQuizPage";

type PageProps = {
  params: Promise<{ unitId: string }>;
};

export default async function QuizWordDetectionUnitPage({ params }: PageProps) {
  const { unitId } = await params;
  const id = Number(unitId);
  if (Number.isNaN(id)) notFound();

  return <UnitQuizPage unitId={id} track="word_detection" />;
}
