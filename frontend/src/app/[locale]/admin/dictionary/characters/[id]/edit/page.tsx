"use client";

import { use } from "react";
import LetterWordFormPage from "@/features/admin/dictionary/LetterWordFormPage";

interface EditCharacterPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCharacterPage({ params }: EditCharacterPageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid character ID</div>;
  }

  return <LetterWordFormPage entityType="letter" entityId={entityId} />;
}
