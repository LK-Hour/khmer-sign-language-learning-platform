"use client";

import {
  Alert,
  Box,
  Button,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";

import type { ContributionListItem } from "../api/contributionsAdminApi";
import ContributionReviewCard from "./ContributionReviewCard";

// ── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface ContributionReviewListProps {
  contributions: ContributionListItem[];
  loading: boolean;
  error: string | null;
  selectedWordId: number | null;
  onRetry: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Filter contributions by status. When filter is "all", all contributions pass. */
export function filterContributionsByStatus(
  contributions: ContributionListItem[],
  status: StatusFilter,
): ContributionListItem[] {
  if (status === "all") return contributions;
  return contributions.filter((c) => c.status === status);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ContributionReviewList({
  contributions,
  loading,
  error,
  selectedWordId,
  onRetry,
}: ContributionReviewListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const handleFilterChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newFilter: StatusFilter | null) => {
      if (newFilter !== null) {
        setStatusFilter(newFilter);
      }
    },
    [],
  );

  const filteredContributions = useMemo(
    () => filterContributionsByStatus(contributions, statusFilter),
    [contributions, statusFilter],
  );

  // ── No word selected state ─────────────────────────────────────────────

  if (!selectedWordId) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 4,
        }}
      >
        <Typography
          sx={{ fontSize: "0.875rem", color: "text.secondary" }}
        >
          Select a word from the tree to view contributions.
        </Typography>
      </Box>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <Stack spacing={2} sx={{ p: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={180} />
        ))}
      </Stack>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // ── Main content ───────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 2 }}>
      {/* Status filter tabs */}
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
      >
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={handleFilterChange}
          size="small"
          aria-label="Filter by status"
        >
          <ToggleButton
            value="all"
            sx={{ textTransform: "none", fontSize: "0.75rem", px: 1.5 }}
          >
            All ({contributions.length})
          </ToggleButton>
          <ToggleButton
            value="pending"
            sx={{ textTransform: "none", fontSize: "0.75rem", px: 1.5 }}
          >
            Pending (
            {contributions.filter((c) => c.status === "pending").length})
          </ToggleButton>
          <ToggleButton
            value="approved"
            sx={{ textTransform: "none", fontSize: "0.75rem", px: 1.5 }}
          >
            Approved (
            {contributions.filter((c) => c.status === "approved").length})
          </ToggleButton>
          <ToggleButton
            value="rejected"
            sx={{ textTransform: "none", fontSize: "0.75rem", px: 1.5 }}
          >
            Rejected (
            {contributions.filter((c) => c.status === "rejected").length})
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Contribution cards */}
      {filteredContributions.length === 0 ? (
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: "text.secondary",
            textAlign: "center",
            py: 4,
          }}
        >
          {contributions.length === 0
            ? "No contributions for this word."
            : `No ${statusFilter} contributions for this word.`}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {filteredContributions.map((contribution) => (
            <ContributionReviewCard
              key={contribution.id}
              contribution={contribution}
              onReviewSuccess={onRetry}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
