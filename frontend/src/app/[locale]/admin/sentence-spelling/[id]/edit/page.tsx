"use client";

import { use } from "react";
import SentenceFormPage from "@/features/admin/sentence-spelling/SentenceFormPage";

interface EditSentencePageProps {
  params: Promise<{ id: string }>;
}

export default function EditSentencePage({ params }: EditSentencePageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid sentence ID</div>;
  }

  return <SentenceFormPage entityId={entityId} />;
}
