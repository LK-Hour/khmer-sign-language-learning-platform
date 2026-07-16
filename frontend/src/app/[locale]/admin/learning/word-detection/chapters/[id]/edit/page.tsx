"use client";

import { use } from "react";
import ChapterFormPage from "@/features/admin/curriculum/ChapterFormPage";

interface EditWordDetectionChapterPageProps {
  params: Promise<{ id: string }>;
}

export default function EditWordDetectionChapterPage({
  params,
}: EditWordDetectionChapterPageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid chapter ID</div>;
  }

  return <ChapterFormPage track="word_detection" entityId={entityId} />;
}
