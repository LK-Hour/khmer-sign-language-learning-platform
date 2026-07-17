"use client";

import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import type { MediaResponse } from "../../api/mediaAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MediaCarouselProps {
  /** Array of media items to cycle through. */
  medias: MediaResponse[];
  /** Fallback text shown when medias is empty. */
  emptyLabel?: string;
  /** Max height of the media display area. */
  maxHeight?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Simple left/right carousel for previewing all media associated with a
 * letter or word. Shows a counter (e.g. "2 / 5") and chevron arrows.
 */
export function MediaCarousel({
  medias,
  emptyLabel = "No media associated yet.",
  maxHeight = 300,
}: MediaCarouselProps) {
  const [index, setIndex] = useState(0);

  const count = medias.length;
  const current = medias[index] ?? null;
  const resolvedUrl = current ? resolveApiAssetUrl(current.file_url) : null;

  const handlePrev = () => setIndex((prev) => (prev - 1 + count) % count);
  const handleNext = () => setIndex((prev) => (prev + 1) % count);

  if (count === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
          borderRadius: 1,
          bgcolor: "grey.100",
          border: "1px dashed",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {/* Media display with chevron overlay */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
          maxHeight,
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "grey.100",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Left chevron */}
        {count > 1 && (
          <IconButton
            onClick={handlePrev}
            size="small"
            sx={{
              position: "absolute",
              left: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              bgcolor: "rgba(255,255,255,0.85)",
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              boxShadow: 1,
            }}
          >
            <ChevronLeftRounded />
          </IconButton>
        )}

        {/* Media content */}
        {resolvedUrl && current?.media_type === "video" ? (
          <video
            key={resolvedUrl}
            controls
            crossOrigin="anonymous"
            preload="metadata"
            src={resolvedUrl}
            style={{ maxWidth: "100%", maxHeight, objectFit: "contain" }}
          />
        ) : resolvedUrl ? (
          <Box
            component="img"
            key={resolvedUrl}
            src={resolvedUrl}
            alt={`Media ${index + 1}`}
            sx={{ maxWidth: "100%", maxHeight, objectFit: "contain" }}
          />
        ) : null}

        {/* Right chevron */}
        {count > 1 && (
          <IconButton
            onClick={handleNext}
            size="small"
            sx={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              bgcolor: "rgba(255,255,255,0.85)",
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              boxShadow: 1,
            }}
          >
            <ChevronRightRounded />
          </IconButton>
        )}
      </Box>

      {/* Counter + file URL */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">
          {index + 1} / {count}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {current?.file_url?.split("/").pop() ?? ""}
        </Typography>
      </Stack>
    </Stack>
  );
}
