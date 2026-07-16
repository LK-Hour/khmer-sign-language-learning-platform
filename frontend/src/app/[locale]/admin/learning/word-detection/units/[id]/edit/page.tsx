"use client";

import { use } from "react";
import UnitFormPage from "@/features/admin/curriculum/UnitFormPage";

interface EditWordDetectionUnitPageProps {
  params: Promise<{ id: string }>;
}

export default function EditWordDetectionUnitPage({
  params,
}: EditWordDetectionUnitPageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid unit ID</div>;
  }

  return <UnitFormPage track="word_detection" entityId={entityId} />;
}
