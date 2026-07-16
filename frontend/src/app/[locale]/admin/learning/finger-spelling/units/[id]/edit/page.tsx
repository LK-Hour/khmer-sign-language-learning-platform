"use client";

import { use } from "react";
import UnitFormPage from "@/features/admin/curriculum/UnitFormPage";

interface EditFingerSpellingUnitPageProps {
  params: Promise<{ id: string }>;
}

export default function EditFingerSpellingUnitPage({
  params,
}: EditFingerSpellingUnitPageProps) {
  const { id } = use(params);
  const entityId = Number(id);

  if (Number.isNaN(entityId)) {
    return <div>Invalid unit ID</div>;
  }

  return <UnitFormPage track="finger" entityId={entityId} />;
}
