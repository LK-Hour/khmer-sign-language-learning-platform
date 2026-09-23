"use client";

import { use } from "react";
import MediaEditPage from "@/features/admin/media/MediaEditPage";

interface EditMediaPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMediaPage({ params }: EditMediaPageProps) {
  const { id } = use(params);
  const mediaId = Number(id);

  if (!Number.isInteger(mediaId) || mediaId < 1) {
    return <div>Invalid media ID</div>;
  }

  return <MediaEditPage mediaId={mediaId} />;
}
