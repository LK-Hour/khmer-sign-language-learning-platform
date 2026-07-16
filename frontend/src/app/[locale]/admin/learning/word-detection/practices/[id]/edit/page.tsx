"use client";

import { use } from "react";
import PracticeFormPage from "@/features/admin/curriculum/PracticeFormPage";

interface EditWordDetectionPracticePageProps {
  params: Promise<{ id: string }>;
}

export default function EditWordDetectionPracticePage({
  params,
}: EditWordDetectionPracticePageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid practice ID</div>;
  }

  return <PracticeFormPage track="word_detection" entityId={entityId} />;
}
