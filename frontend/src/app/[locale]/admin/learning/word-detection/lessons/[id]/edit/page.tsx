"use client";

import { use } from "react";
import LessonFormPage from "@/features/admin/curriculum/LessonFormPage";

interface EditWordDetectionLessonPageProps {
  params: Promise<{ id: string }>;
}

export default function EditWordDetectionLessonPage({
  params,
}: EditWordDetectionLessonPageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid lesson ID</div>;
  }

  return <LessonFormPage track="word_detection" entityId={entityId} />;
}
