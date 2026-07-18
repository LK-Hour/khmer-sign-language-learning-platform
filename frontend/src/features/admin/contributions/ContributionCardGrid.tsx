"use client";

import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/utils/api/client";

import type { ContributionDetail } from "../api/contributionsAdminApi";
import * as contributionsApi from "../api/contributionsAdminApi";
import ContributionCard from "./ContributionCard";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContributionCardGridProps {
  wordId: number;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Filter contributions by status. When filter is "all", all contributions pass. */
export function filterContributionsByStatus(
  contributions: ContributionDetail[],
  status: StatusFilter,
): ContributionDetail[] {
  if (status === "all") return contributions;
  return contributions.filter((c) => c.status === status);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ContributionCardGrid({ wordId }: ContributionCardGridProps) {
  const [contributions, setContributions] = useState<ContributionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contributionsApi.listContributions({ word_id: wordId, status: "all" });
      // Fetch full detail for each contribution to get video_url
      const detailed: ContributionDetail[] = await Promise.all(
        data.map(async (item) => {
          try {
            const detail = await contributionsApi.getContribution(item.id);
            return detail;
          } catch {
            // Fallback: use list item data without video
            return {
              ...item,
              video_url: null,
              word_id: wordId,
              user_id: null,
              guest_id: null,
              reviewed_by: null,
              reviewed_at: null,
              rejection_reason: null,
            };
          }
        }),
      );
      setContributions(detailed);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load contributions",
      );
    } finally {
      setLoading(false);
    }
  }, [wordId]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleFilterChange = useCallback((event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as StatusFilter);
  }, []);

  const handleApprove = useCallback(
    async (id: string) => {
      setActionError(null);
      try {
        await contributionsApi.approveContribution(id);
        fetchContributions();
      } catch (err) {
        setActionError(
          err instanceof ApiError
            ? err.message
            : "Failed to approve contribution",
        );
      }
    },
    [fetchContributions],
  );

  const handleReject = useCallback(
    async (id: string) => {
      setActionError(null);
      try {
        await contributionsApi.rejectContribution(id, "Rejected by admin");
        fetchContributions();
      } catch (err) {
        setActionError(
          err instanceof ApiError
            ? err.message
            : "Failed to reject contribution",
        );
      }
    },
    [fetchContributions],
  );

  // ── Derived state ────────────────────────────────────────────────────────

  const filteredContributions = useMemo(
    () => filterContributionsByStatus(contributions, statusFilter),
    [contributions, statusFilter],
  );

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box>
        <Stack direction="row" sx={{ mb: 3, justifyContent: "flex-end" }}>
          <Skeleton variant="rounded" width={160} height={40} />
        </Stack>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchContributions}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  // ── Main content ───────────────────────────────────────────────────────

  return (
    <Box>
      {/* Status filter dropdown */}
      <Stack direction="row" sx={{ mb: 3, justifyContent: "flex-end" }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="contribution-status-filter-label">Status</InputLabel>
          <Select
            labelId="contribution-status-filter-label"
            id="contribution-status-filter"
            value={statusFilter}
            label="Status"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Contribution cards grid */}
      {filteredContributions.length === 0 ? (
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: "text.secondary",
            textAlign: "center",
            py: 6,
          }}
        >
          {contributions.length === 0
            ? "No contributions for this word yet."
            : `No ${statusFilter} contributions found.`}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredContributions.map((contribution) => (
            <Grid key={contribution.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ContributionCard
                contribution={contribution}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
