"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Check from "@mui/icons-material/Check";
import Close from "@mui/icons-material/Close";
import { useCallback, useEffect, useState } from "react";

import type { ContributionListItem } from "../api/contributionsAdminApi";
import * as contributionsApi from "../api/contributionsAdminApi";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import StatusChip from "../components/shared/StatusChip";
import type { StatusVariant } from "../components/shared/StatusChip";

// ── Types ────────────────────────────────────────────────────────────────────

interface ContributionReviewCardProps {
  contribution: ContributionListItem;
  onReviewSuccess: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusVariant(status: ContributionListItem["status"]): StatusVariant {
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

export default function ContributionReviewCard({
  contribution,
  onReviewSuccess,
}: ContributionReviewCardProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);

  // Fetch the detail to get the video URL
  useEffect(() => {
    let cancelled = false;
    const fetchVideo = async () => {
      try {
        const detail = await contributionsApi.getContribution(contribution.id);
        if (!cancelled && detail?.video_url) {
          setVideoUrl(resolveApiAssetUrl(detail.video_url) ?? detail.video_url);
        }
      } catch {
        // Silently fail — video just won't show
      }
    };
    fetchVideo();
    return () => { cancelled = true; };
  }, [contribution.id]);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await contributionsApi.approveContribution(contribution.id);
      onReviewSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve contribution",
      );
    } finally {
      setLoading(false);
    }
  }, [contribution.id, onReviewSuccess]);

  const handleReject = useCallback(async () => {
    if (!rejectionReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await contributionsApi.rejectContribution(
        contribution.id,
        rejectionReason.trim(),
      );
      setShowRejectInput(false);
      setRejectionReason("");
      onReviewSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject contribution",
      );
    } finally {
      setLoading(false);
    }
  }, [contribution.id, rejectionReason, onReviewSuccess]);

  const handleCancelReject = useCallback(() => {
    setShowRejectInput(false);
    setRejectionReason("");
    setError(null);
  }, []);

  return (
    <Card
      sx={{
        borderRadius: "12px",
        boxShadow: "var(--Paper-shadow, 0px 12px 24px -4px rgba(145,158,171,0.12), 0px 0px 2px 0px rgba(145,158,171,0.2))",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* Video Player */}
        {videoUrl && !videoError && (
          <Box
            sx={{
              mb: 2,
              borderRadius: "8px",
              overflow: "hidden",
              bgcolor: "#000",
              maxHeight: 240,
            }}
          >
            <video
              controls
              crossOrigin="anonymous"
              preload="metadata"
              onError={() => setVideoError(true)}
              style={{
                width: "100%",
                maxHeight: 240,
                display: "block",
              }}
              src={videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        )}
        {videoError && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: "8px",
              bgcolor: "background.neutral",
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              Video file not available
            </Typography>
          </Box>
        )}

        {/* Contributor Info Row */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              {contribution.contributor_name}
            </Typography>
            <Typography
              sx={{ fontSize: "0.75rem", color: "text.secondary" }}
            >
              Submitted {formatDate(contribution.created_at)}
            </Typography>
          </Box>

          {/* Status Badge */}
          <StatusChip
            variant={getStatusVariant(contribution.status)}
            label={contribution.status}
          />
        </Stack>

        {/* Error alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, fontSize: "0.75rem" }}>
            {error}
          </Alert>
        )}

        {/* Actions: only for pending contributions */}
        {contribution.status === "pending" && (
          <Stack spacing={1.5}>
            {!showRejectInput ? (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  startIcon={
                    loading ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <Check />
                    )
                  }
                  disabled={loading}
                  onClick={handleApprove}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="error"
                  startIcon={<Close />}
                  disabled={loading}
                  onClick={() => setShowRejectInput(true)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Reject
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1}>
                <TextField
                  label="Rejection Reason"
                  placeholder="Enter reason for rejection..."
                  multiline
                  minRows={2}
                  maxRows={4}
                  size="small"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={loading}
                  fullWidth
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    disabled={loading || !rejectionReason.trim()}
                    onClick={handleReject}
                    startIcon={
                      loading ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <Close />
                      )
                    }
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Confirm Reject
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={loading}
                    onClick={handleCancelReject}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
