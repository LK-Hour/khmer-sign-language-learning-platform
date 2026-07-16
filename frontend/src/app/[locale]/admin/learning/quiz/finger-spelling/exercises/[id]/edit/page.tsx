import { notFound } from "next/navigation";
import { use } from "react";

import ExerciseFormPage from "@/features/admin/exercises/ExerciseFormPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditFingerExercisePage({ params }: PageProps) {
  const { id } = use(params);
  const numericId = Number(id);
  if (Number.isNaN(numericId)) notFound();

  return <ExerciseFormPage entityId={numericId} track="finger" />;
}
