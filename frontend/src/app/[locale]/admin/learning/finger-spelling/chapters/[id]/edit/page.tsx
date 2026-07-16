"use client";

import { use } from "react";
import ChapterFormPage from "@/features/admin/curriculum/ChapterFormPage";

interface EditFingerSpellingChapterPageProps {
  params: Promise<{ id: string }>;
}

export default function EditFingerSpellingChapterPage({
  params,
}: EditFingerSpellingChapterPageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid chapter ID</div>;
  }

  return <ChapterFormPage track="finger" entityId={entityId} />;
}
