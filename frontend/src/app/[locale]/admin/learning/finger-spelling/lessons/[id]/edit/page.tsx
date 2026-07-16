"use client";

import { use } from "react";
import LessonFormPage from "@/features/admin/curriculum/LessonFormPage";

interface EditFingerSpellingLessonPageProps {
  params: Promise<{ id: string }>;
}

export default function EditFingerSpellingLessonPage({
  params,
}: EditFingerSpellingLessonPageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid lesson ID</div>;
  }

  return <LessonFormPage track="finger" entityId={entityId} />;
}
