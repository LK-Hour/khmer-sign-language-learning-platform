"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Check from "@mui/icons-material/Check";
import Close from "@mui/icons-material/Close";

import { ApiError } from "@/utils/api/client";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";

import type { ContributionDetail } from "../api/contributionsAdminApi";
import * as contributionsApi from "../api/contributionsAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

interface ContributionReviewPageProps {
  contributionId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string): "warning" | "success" | "error" | "default" {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "error";
    default:
      return "default";
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ContributionReviewPage({
  contributionId,
}: ContributionReviewPageProps) {
  const router = useRouter();

  // Data state
  const [contribution, setContribution] = useState<ContributionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reject form state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Media state
  const [videoError, setVideoError] = useState(false);

  // ── Fetch contribution detail ────────────────────────────────────────────

  const fetchContribution = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contributionsApi.getContribution(contributionId);
      setContribution(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load contribution details",
      );
    } finally {
      setLoading(false);
    }
  }, [contributionId]);

  useEffect(() => {
    fetchContribution();
  }, [fetchContribution]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleBack = () => {
    router.push("/admin/contributions");
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await contributionsApi.approveContribution(contributionId);
      router.push("/admin/contributions?success=approved");
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Failed to approve contribution",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError("Rejection reason is required.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await contributionsApi.rejectContribution(
        contributionId,
        rejectionReason.trim(),
      );
      router.push("/admin/contributions?success=rejected");
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Failed to reject contribution",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectionReason("");
    setActionError(null);
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box>
        <Stack direction="row" sx={{ alignItems: "center", mb: 3 }}>
          <Skeleton variant="rounded" width={100} height={36} />
        </Stack>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error || !contribution) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 2, textTransform: "none" }}
        >
          Back to Contributions
        </Button>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchContribution}>
              Retry
            </Button>
          }
        >
          {error || "Contribution not found"}
        </Alert>
      </Box>
    );
  }

  // ── Resolve media URL ──────────────────────────────────────────────────

  const mediaUrl = contribution.video_url
    ? resolveApiAssetUrl(contribution.video_url) ?? contribution.video_url
    : null;

  const isVideo = contribution.video_url
    ? /\.(mp4|webm|ogg|mov)$/i.test(contribution.video_url) ||
      contribution.video_url.includes("video")
    : false;

  // ── Main content ───────────────────────────────────────────────────────

  return (
    <Box sx={{ pb: 4 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{ mb: 3, textTransform: "none" }}
      >
        Back to Contributions
      </Button>

      {/* Page Title */}
      <Stack
        direction="row"
        sx={{ alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}
      >
        <Typography variant="h4">
          Review Contribution
        </Typography>
        <Chip
          label={contribution.status}
          color={getStatusColor(contribution.status)}
          size="small"
          sx={{ fontWeight: 600, textTransform: "capitalize" }}
        />
      </Stack>

      {/* Action Error */}
      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {actionError}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        {/* Left Column: Media */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Contributed Media
            </Typography>

            {mediaUrl && !videoError ? (
              <Box
                sx={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  bgcolor: "#000",
                }}
              >
                {isVideo ? (
                  <video
                    controls
                    crossOrigin="anonymous"
                    preload="metadata"
                    onError={() => setVideoError(true)}
                    style={{
                      width: "100%",
                      maxHeight: 400,
                      display: "block",
                    }}
                    src={mediaUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <Box
                    component="img"
                    src={mediaUrl}
                    alt={`Contribution by ${contribution.contributor_name}`}
                    onError={() => setVideoError(true)}
                    sx={{
                      width: "100%",
                      maxHeight: 400,
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  p: 4,
                  borderRadius: "8px",
                  bgcolor: "action.hover",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                  {videoError
                    ? "Media file not available or failed to load"
                    : "No media file attached to this contribution"}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Details */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Contribution Details
            </Typography>

            <Stack spacing={2}>
              {/* Contributor Info */}
              <DetailRow label="Contributor" value={contribution.contributor_name} />
              <DetailRow
                label="User ID"
                value={contribution.user_id ?? "Guest"}
              />
              {contribution.guest_id && (
                <DetailRow label="Guest ID" value={contribution.guest_id} />
              )}

              <Divider />

              {/* Word Reference */}
              <DetailRow label="Word (Khmer)" value={contribution.word_kh} />
              <DetailRow label="Word (English)" value={contribution.word_en ?? "—"} />
              <DetailRow label="Word ID" value={String(contribution.word_id)} />

              <Divider />

              {/* Status & Review */}
              <DetailRow label="Status" value={contribution.status} />
              {contribution.reviewed_by && (
                <DetailRow label="Reviewed By" value={contribution.reviewed_by} />
              )}
              {contribution.reviewed_at && (
                <DetailRow
                  label="Reviewed At"
                  value={formatDateTime(contribution.reviewed_at)}
                />
              )}
              {contribution.rejection_reason && (
                <DetailRow
                  label="Rejection Reason"
                  value={contribution.rejection_reason}
                />
              )}

              <Divider />

              {/* Timestamps */}
              <DetailRow
                label="Created At"
                value={formatDateTime(contribution.created_at)}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Action Section — only for pending contributions */}
      {contribution.status === "pending" && (
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Review Actions
            </Typography>

            {!showRejectForm ? (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={
                    actionLoading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Check />
                    )
                  }
                  disabled={actionLoading}
                  onClick={handleApprove}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Close />}
                  disabled={actionLoading}
                  onClick={() => setShowRejectForm(true)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Reject
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="Rejection Reason"
                  placeholder="Enter the reason for rejecting this contribution..."
                  multiline
                  minRows={3}
                  maxRows={6}
                  fullWidth
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={actionLoading}
                  error={Boolean(actionError && !rejectionReason.trim())}
                  helperText={
                    !rejectionReason.trim() && actionError
                      ? "Rejection reason is required"
                      : undefined
                  }
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={
                      actionLoading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <Close />
                      )
                    }
                    disabled={actionLoading || !rejectionReason.trim()}
                    onClick={handleReject}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Confirm Rejection
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    disabled={actionLoading}
                    onClick={handleCancelReject}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ── Sub-Components ───────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
      <Typography
        sx={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "text.secondary",
          minWidth: 120,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          color: "text.primary",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
