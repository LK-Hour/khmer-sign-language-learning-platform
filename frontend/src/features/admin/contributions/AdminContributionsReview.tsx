"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import { ApiError } from "@/utils/api/client";

import * as contributionsApi from "../api/contributionsAdminApi";
import type {
  ContributionListItem,
  ContributionTreeNode,
} from "../api/contributionsAdminApi";
import PageHeader from "../components/shared/PageHeader";

import ContributionTree from "./ContributionTree";
import ContributionReviewList from "./ContributionReviewList";

// ── Constants ────────────────────────────────────────────────────────────────

const TREE_SIDEBAR_WIDTH = 320;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively sum pending_count across all tree nodes. */
function sumPendingCount(nodes: ContributionTreeNode[]): number {
  return nodes.reduce((total, node) => {
    return total + node.pending_count + sumPendingCount(node.children);
  }, 0);
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminContributionsReview() {
  const { t } = useTranslation();

  // Tree state
  const [tree, setTree] = useState<ContributionTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);

  // Selected word state
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  // Contributions list state for selected word
  const [contributions, setContributions] = useState<ContributionListItem[]>([]);
  const [contributionsLoading, setContributionsLoading] = useState(false);
  const [contributionsError, setContributionsError] = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);
    try {
      const data = await contributionsApi.getContributionTree();
      setTree(data);
    } catch (err) {
      setTreeError(
        err instanceof ApiError
          ? err.message
          : "Failed to load curriculum tree",
      );
    } finally {
      setTreeLoading(false);
    }
  }, []);

  const fetchContributions = useCallback(async (wordId: number) => {
    setContributionsLoading(true);
    setContributionsError(null);
    try {
      const data = await contributionsApi.listContributions({ word_id: wordId, status: "all" });
      setContributions(data);
    } catch (err) {
      setContributionsError(
        err instanceof ApiError
          ? err.message
          : "Failed to load contributions",
      );
    } finally {
      setContributionsLoading(false);
    }
  }, []);

  // Fetch tree on mount
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Fetch contributions when selected word changes
  useEffect(() => {
    if (selectedWordId !== null) {
      fetchContributions(selectedWordId);
    } else {
      setContributions([]);
      setContributionsError(null);
    }
  }, [selectedWordId, fetchContributions]);

  // ── Derived state ────────────────────────────────────────────────────────

  const totalPendingCount = useMemo(() => sumPendingCount(tree), [tree]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectWord = useCallback((wordId: number) => {
    setSelectedWordId(wordId);
  }, []);

  const handleRetryContributions = useCallback(() => {
    if (selectedWordId !== null) {
      fetchContributions(selectedWordId);
    }
  }, [selectedWordId, fetchContributions]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title={t("ADMIN.DATA_CONTRIBUTION_WORD")}
        subtitle={`${t("ADMIN.MANAGEMENT")} / ${t("ADMIN.DATA_CONTRIBUTION_WORD")}`}
        action={
          <Chip
            label={`${totalPendingCount} pending`}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "0.75rem",
              bgcolor: totalPendingCount > 0 ? "rgba(255, 171, 0, 0.12)" : "rgba(34, 197, 94, 0.12)",
              color: totalPendingCount > 0 ? "#B76E00" : "#118D57",
            }}
          />
        }
      />

      <Stack
        direction="row"
        sx={{ flex: 1, overflow: "hidden", minHeight: 0, borderRadius: "12px", border: (t) => `1px solid ${t.palette.divider}` }}
      >
        {/* Left panel: Curriculum tree sidebar */}
        <Box
          sx={{
            width: TREE_SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: (t) => `1px dashed ${t.palette.divider}`,
            overflow: "auto",
            bgcolor: "background.paper",
          }}
        >
          {treeLoading ? (
            <Stack spacing={1} sx={{ p: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="rounded" height={32} />
              ))}
            </Stack>
          ) : treeError ? (
            <Stack sx={{ p: 2 }} spacing={1}>
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={fetchTree}>
                    Retry
                  </Button>
                }
              >
                {treeError}
              </Alert>
            </Stack>
          ) : (
            <ContributionTree
              tree={tree}
              selectedWordId={selectedWordId}
              onSelectWord={handleSelectWord}
            />
          )}
        </Box>

        {/* Right panel: Contribution review list */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            bgcolor: "background.default",
          }}
        >
          <ContributionReviewList
            contributions={contributions}
            loading={contributionsLoading}
            error={contributionsError}
            selectedWordId={selectedWordId}
            onRetry={handleRetryContributions}
          />
        </Box>
      </Stack>
    </>
  );
}
