"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import Check from "@mui/icons-material/Check";
import Close from "@mui/icons-material/Close";
import PlayCircleOutlined from "@mui/icons-material/PlayCircleOutlined";
import { useCallback, useState } from "react";

import type { ContributionDetail } from "../api/contributionsAdminApi";
import StatusChip from "../components/shared/StatusChip";
import type { StatusVariant } from "../components/shared/StatusChip";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContributionCardProps {
  contribution: ContributionDetail;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusVariant(status: ContributionDetail["status"]): StatusVariant {
  switch (status) {
    case "approved":
      return "published";
    case "rejected":
      return "inactive";
    case "pending":
    default:
      return "pending";
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ContributionCard({
  contribution,
  onApprove,
  onReject,
}: ContributionCardProps) {
  const [playing, setPlaying] = useState(false);
  const videoUrl = contribution.video_url
    ? resolveApiAssetUrl(contribution.video_url) ?? contribution.video_url
    : null;

  const handlePlayClick = useCallback(() => {
    setPlaying(true);
  }, []);

  return (
    <Card
      sx={{
        borderRadius: "12px",
        boxShadow:
          "0px 12px 24px -4px rgba(145,158,171,0.12), 0px 0px 2px 0px rgba(145,158,171,0.2)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{ p: 2, "&:last-child": { pb: 2 }, flex: 1, display: "flex", flexDirection: "column" }}
      >
        {/* Video Thumbnail / Player */}
        <Box
          sx={{
            mb: 2,
            borderRadius: "8px",
            overflow: "hidden",
            bgcolor: "grey.900",
            position: "relative",
            aspectRatio: "16/9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: !playing && videoUrl ? "pointer" : "default",
          }}
          onClick={!playing && videoUrl ? handlePlayClick : undefined}
        >
          {videoUrl && playing ? (
            <video
              autoPlay
              controls
              preload="auto"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
              src={videoUrl}
            />
          ) : videoUrl ? (
            <video
              preload="metadata"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              src={`${videoUrl}#t=0.5`}
            />
          ) : null}
          {/* Play icon overlay — shown only in thumbnail mode */}
          {!playing && videoUrl && (
            <PlayCircleOutlined
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 48,
                color: "rgba(255, 255, 255, 0.85)",
                pointerEvents: "none",
              }}
            />
          )}
        </Box>

        {/* Contributor Info */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
        >
          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contribution.contributor_name}
          </Typography>
          <StatusChip
            variant={getStatusVariant(contribution.status)}
            label={contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
          />
        </Stack>

        {/* Submission date */}
        <Typography
          sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1.5 }}
        >
          Submitted {formatDate(contribution.created_at)}
        </Typography>

        {/* Action buttons — only for pending contributions */}
        {contribution.status === "pending" && (
          <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<Check />}
              onClick={() => onApprove(contribution.id)}
              sx={{ textTransform: "none", fontWeight: 600, flex: 1 }}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              startIcon={<Close />}
              onClick={() => onReject(contribution.id)}
              sx={{ textTransform: "none", fontWeight: 600, flex: 1 }}
            >
              Reject
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
