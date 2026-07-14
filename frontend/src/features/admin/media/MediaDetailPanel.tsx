"use client";

import Close from "@mui/icons-material/Close";
import {
  Box,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import type { MediaResponse } from "../api/mediaAdminApi";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";

interface MediaDetailPanelProps {
  media: MediaResponse | null;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

/** Slide-out detail panel showing media associations and actions. Stub for task 8.3. */
export default function MediaDetailPanel({
  media,
  onClose,
  onDeleted: _onDeleted,
  onUpdated: _onUpdated,
}: MediaDetailPanelProps) {
  if (!media) return null;

  return (
    <Drawer anchor="right" open={!!media} onClose={onClose}>
      <Stack sx={{ width: { xs: 320, sm: 400 }, p: 3 }} spacing={2}>
        {/* Header */}
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
            Media Detail
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Stack>

        {/* Preview */}
        {media.media_type === "video" ? (
          <video
            controls
            crossOrigin="anonymous"
            preload="metadata"
            src={resolveApiAssetUrl(media.file_url) ?? media.file_url}
            style={{
              width: "100%",
              maxHeight: 240,
              objectFit: "contain",
              borderRadius: 4,
              backgroundColor: "#000",
            }}
          />
        ) : (
          <Box
            component="img"
            src={resolveApiAssetUrl(media.file_url) ?? media.file_url}
            alt={`Media ${media.id}`}
            sx={{
              width: "100%",
              maxHeight: 240,
              objectFit: "contain",
              borderRadius: 1,
              bgcolor: "grey.200",
            }}
          />
        )}

        {/* Info */}
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              Type:
            </Typography>
            <Chip label={media.media_type} size="small" />
          </Stack>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            Created: {new Date(media.created_at).toLocaleString()}
          </Typography>
          <Typography
            noWrap
            sx={{ fontSize: "0.75rem", color: "text.secondary" }}
          >
            URL: {media.file_url}
          </Typography>
        </Stack>

        {/* Associations */}
        <Stack spacing={1}>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "text.primary" }}>
            Associations ({media.associations.length})
          </Typography>
          {media.associations.length === 0 ? (
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              No associations. This media is not linked to any letter or word.
            </Typography>
          ) : (
            <Stack spacing={0.5}>
              {media.associations.map((assoc) => (
                <Chip
                  key={`${assoc.target_type}-${assoc.target_id}`}
                  label={`${assoc.target_type}: ${assoc.target_name}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </Stack>

        {/* Actions placeholder — will be implemented in task 8.3 */}
      </Stack>
    </Drawer>
  );
}
