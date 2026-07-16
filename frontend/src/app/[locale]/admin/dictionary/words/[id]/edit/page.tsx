"use client";

import { use } from "react";
import LetterWordFormPage from "@/features/admin/dictionary/LetterWordFormPage";

interface EditWordPageProps {
  params: Promise<{ id: string }>;
}

export default function EditWordPage({ params }: EditWordPageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid word ID</div>;
  }

  return <LetterWordFormPage entityType="word" entityId={entityId} />;
}
