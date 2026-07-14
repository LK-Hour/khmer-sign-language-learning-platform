"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Skeleton, Stack } from "@mui/material";

import { listUnits } from "../../api/adminApi";
import type { AdminUnit } from "../../api/types";
import { ApiError } from "@/utils/api/client";
import type { NavTreeNodeConfig } from "./navTypes";
import NavTreeItem from "./NavTreeItem";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Transform fetched units into NavTreeNodeConfig[] with quiz paths.
 */
function transformUnits(
  units: AdminUnit[],
  track: "finger" | "word_detection",
): NavTreeNodeConfig[] {
  const pathSegment = track === "finger" ? "finger-spelling" : "word-detection";
  return units.map((unit) => ({
    id: `quiz-${track}-unit-${unit.id}`,
    title: unit.name_en || unit.name_kh,
    path: `/admin/learning/quiz/${pathSegment}/${unit.id}`,
  }));
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface DynamicQuizNavProps {
  track: "finger" | "word_detection";
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onNavigate?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DynamicQuizNav({
  track,
  depth,
  expandedIds,
  onToggle,
  onNavigate,
}: DynamicQuizNavProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NavTreeNodeConfig[] | null>(null);

  // Cache the fetched result to avoid re-fetching on expand/collapse cycles
  const cacheRef = useRef<NavTreeNodeConfig[] | null>(null);

  const fetchUnits = useCallback(async () => {
    if (cacheRef.current) {
      setNodes(cacheRef.current);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await listUnits(track);
      const transformed = transformUnits(data, track);
      cacheRef.current = transformed;
      setNodes(transformed);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load units",
      );
    } finally {
      setLoading(false);
    }
  }, [track]);

  // Fetch on mount
  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Stack spacing={0.5} sx={{ pl: 1.5 + depth * 1.5, pr: 1.5, py: 0.5 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={28} />
        ))}
      </Stack>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <Stack spacing={1} sx={{ pl: 1.5 + depth * 1.5, pr: 1.5, py: 0.5 }}>
        <Alert
          severity="error"
          variant="outlined"
          sx={{ fontSize: "0.75rem", py: 0.5 }}
          action={
            <Button size="small" onClick={fetchUnits}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Stack>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (!nodes || nodes.length === 0) {
    return null;
  }

  // ── Render tree nodes ────────────────────────────────────────────────────

  return (
    <>
      {nodes.map((node, index) => (
        <NavTreeItem
          key={node.id}
          node={node}
          depth={depth}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onNavigate={onNavigate}
          isLast={index === nodes.length - 1}
        />
      ))}
    </>
  );
}
