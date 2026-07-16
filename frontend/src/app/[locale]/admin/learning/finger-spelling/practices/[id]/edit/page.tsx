"use client";

import { use } from "react";
import PracticeFormPage from "@/features/admin/curriculum/PracticeFormPage";

interface EditFingerSpellingPracticePageProps {
  params: Promise<{ id: string }>;
}

export default function EditFingerSpellingPracticePage({
  params,
}: EditFingerSpellingPracticePageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid practice ID</div>;
  }

  return <PracticeFormPage track="finger" entityId={entityId} />;
}
