"use client";

import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PlayArrow from "@mui/icons-material/PlayArrow";

import type { MediaResponse } from "../api/mediaAdminApi";
import type { ViewMode } from "./AdminMediaManager";
import Scrollbar from "../components/shared/Scrollbar";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";

interface MediaGridProps {
  items: MediaResponse[];
  viewMode: ViewMode;
  onSelect: (media: MediaResponse) => void;
}

/** Returns true if the media item is a video type (mp4, webm). */
function isVideo(item: MediaResponse): boolean {
  return item.media_type === "video";
}

/** Thumbnail preview — renders img for images/gifs, video poster for videos. */
function MediaThumbnail({
  item,
  width,
  height,
}: {
  item: MediaResponse;
  width: number | string;
  height: number | string;
}) {
  const src = resolveApiAssetUrl(item.file_url) ?? item.file_url;

  if (isVideo(item)) {
    return (
      <Box
        sx={{
          position: "relative",
          width,
          height,
          borderRadius: "12px",
          overflow: "hidden",
          bgcolor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <video
          src={src}
          crossOrigin="anonymous"
          preload="metadata"
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <PlayArrow
          sx={{
            position: "absolute",
            fontSize: 28,
            color: "rgba(255,255,255,0.85)",
            pointerEvents: "none",
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={`Media ${item.id}`}
      sx={{
        width,
        height,
        objectFit: "cover",
        borderRadius: "12px 12px 0 0",
        bgcolor: "grey.200",
      }}
    />
  );
}

/** Renders media assets as a thumbnail grid or list table. */
export default function MediaGrid({ items, viewMode, onSelect }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          No media assets found.
        </Typography>
      </Stack>
    );
  }

  if (viewMode === "list") {
    return (
      <Card>
        <TableContainer component={Scrollbar}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow
                sx={{
                  "& .MuiTableCell-head": {
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "text.secondary",
                    backgroundColor: "#F4F6F8",
                  },
                }}
              >
                <TableCell>Preview</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>File URL</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    cursor: "pointer",
                    "& .MuiTableCell-body": {
                      fontSize: "0.875rem",
                      borderBottomStyle: "dashed",
                    },
                    "&:hover": {
                      bgcolor: "rgba(145, 158, 171, 0.08)",
                    },
                  }}
                  onClick={() => onSelect(item)}
                >
                  <TableCell>
                    <MediaThumbnail item={item} width={48} height={48} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.media_type}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: "0.75rem", borderRadius: "6px" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      noWrap
                      sx={{ fontSize: "0.75rem", maxWidth: 300, color: "text.secondary" }}
                    >
                      {item.file_url}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  // Grid view with Minimals elevation-0 Card styling
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(4, 1fr)",
          lg: "repeat(5, 1fr)",
        },
        gap: 2,
      }}
    >
      {items.map((item) => (
        <Card
          key={item.id}
          sx={{
            borderRadius: "12px",
            boxShadow: "var(--Paper-shadow, 0px 12px 24px -4px rgba(145,158,171,0.12), 0px 0px 2px 0px rgba(145,158,171,0.2))",
            transition: "box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out",
            "&:hover": {
              boxShadow: "0px 16px 32px -4px rgba(145,158,171,0.2), 0px 0px 4px 0px rgba(145,158,171,0.24)",
              transform: "translateY(-2px)",
            },
          }}
        >
          <CardActionArea onClick={() => onSelect(item)}>
            <MediaThumbnail item={item} width="100%" height={140} />
            <Stack sx={{ p: 1.5 }}>
              <Chip
                label={item.media_type}
                size="small"
                sx={{
                  alignSelf: "flex-start",
                  mb: 0.5,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                }}
              />
              <Typography
                noWrap
                sx={{ fontSize: "0.75rem", color: "text.secondary" }}
              >
                {new Date(item.created_at).toLocaleDateString()}
              </Typography>
            </Stack>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
