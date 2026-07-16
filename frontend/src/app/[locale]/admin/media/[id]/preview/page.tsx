"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Box, Button } from "@mui/material";

import { ApiError } from "@/utils/api/client";

import { getMediaDetail } from "@/features/admin/api/mediaAdminApi";
import type { MediaResponse } from "@/features/admin/api/mediaAdminApi";
import MediaPreviewView, {
  MediaPreviewSkeleton,
} from "@/features/admin/media/MediaPreviewView";

export default function MediaPreviewPage() {
  const params = useParams<{ id: string }>();
  const mediaId = Number(params.id);

  const [media, setMedia] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId || isNaN(mediaId)) {
      setError("Invalid media ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchMedia() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMediaDetail(mediaId);
        if (!cancelled) {
          setMedia(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load media details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchMedia();
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <MediaPreviewSkeleton />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!media) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Media not found.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <MediaPreviewView media={media} associations={media.associations} />
    </Box>
  );
}
