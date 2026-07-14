"use client";

import { Box, Typography } from "@mui/material";

import type { ContributionTreeNode } from "../api/contributionsAdminApi";

import ContributionTreeNodeComponent from "./ContributionTreeNode";

// ── Props ────────────────────────────────────────────────────────────────────

interface ContributionTreeProps {
  tree: ContributionTreeNode[];
  selectedWordId: number | null;
  onSelectWord: (wordId: number) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Renders the curriculum tree sidebar: Units → Chapters (Levels) → Lessons (Words).
 * Each node shows a pending contribution count badge when applicable.
 * Clicking a lesson (leaf) node triggers onSelectWord with the word_id.
 */
export default function ContributionTree({
  tree,
  selectedWordId,
  onSelectWord,
}: ContributionTreeProps) {
  return (
    <Box sx={{ p: 1.5 }}>
      {/* Empty state */}
      {tree.length === 0 ? (
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: "grey.400",
            px: 0.5,
          }}
        >
          No curriculum data available.
        </Typography>
      ) : (
        /* Tree nodes */
        <Box>
          {tree.map((unitNode) => (
            <ContributionTreeNodeComponent
              key={`${unitNode.node_type}-${unitNode.id}`}
              node={unitNode}
              level={0}
              selectedWordId={selectedWordId}
              onSelectWord={onSelectWord}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
