"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Skeleton, Stack } from "@mui/material";

import {
  getContributionTree,
  type ContributionTreeNode,
} from "../../api/contributionsAdminApi";
import { ApiError } from "@/utils/api/client";
import type { NavTreeNodeConfig } from "./navTypes";
import NavTreeItem from "./NavTreeItem";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Transform the API contribution tree into NavTreeNodeConfig[].
 * - unit nodes → parent with id: `contrib-unit-{id}`
 * - chapter nodes → parent with id: `contrib-chapter-{id}`
 * - lesson/word nodes → leaf with path: `/admin/learning/contributions/{id}`
 */
function transformTree(nodes: ContributionTreeNode[]): NavTreeNodeConfig[] {
  return nodes.map((node) => {
    switch (node.node_type) {
      case "unit":
        return {
          id: `contrib-unit-${node.id}`,
          title: node.name_en || node.name_kh,
          children: transformTree(node.children),
        };
      case "chapter":
        return {
          id: `contrib-chapter-${node.id}`,
          title: node.name_en || node.name_kh,
          children: transformTree(node.children),
        };
      case "lesson":
      default:
        return {
          id: `contrib-lesson-${node.id}`,
          title: node.name_en || node.name_kh,
          path: `/admin/learning/contributions/${node.id}`,
        };
    }
  });
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface DynamicContributionNavProps {
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onNavigate?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DynamicContributionNav({
  depth,
  expandedIds,
  onToggle,
  onNavigate,
}: DynamicContributionNavProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NavTreeNodeConfig[] | null>(null);

  // Cache the fetched result to avoid re-fetching on expand/collapse cycles
  const cacheRef = useRef<NavTreeNodeConfig[] | null>(null);

  const fetchTree = useCallback(async () => {
    // Use cache if available
    if (cacheRef.current) {
      setNodes(cacheRef.current);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getContributionTree();
      const transformed = transformTree(data);
      cacheRef.current = transformed;
      setNodes(transformed);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load contribution tree",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

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
            <Button size="small" onClick={fetchTree}>
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
      {nodes.map((node) => (
        <NavTreeItem
          key={node.id}
          node={node}
          depth={depth}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}
