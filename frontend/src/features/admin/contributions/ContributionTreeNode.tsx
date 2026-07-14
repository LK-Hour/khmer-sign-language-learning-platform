"use client";

import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Badge, Box, Collapse, IconButton, Typography } from "@mui/material";
import { useCallback, useState } from "react";

import type { ContributionTreeNode as TreeNode } from "../api/contributionsAdminApi";

// ── Props ────────────────────────────────────────────────────────────────────

interface ContributionTreeNodeProps {
  node: TreeNode;
  level: number;
  selectedWordId: number | null;
  onSelectWord: (wordId: number) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const INDENT_PX = 20;
const CONNECTOR_LEFT_OFFSET = 10;

// ── Component ────────────────────────────────────────────────────────────────

export default function ContributionTreeNodeComponent({
  node,
  level,
  selectedWordId,
  onSelectWord,
}: ContributionTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const isLeaf = node.node_type === "lesson";
  const isSelected = isLeaf && selectedWordId === node.id;
  const hasPending = node.pending_count > 0;

  const handleToggle = useCallback(() => {
    if (isLeaf) {
      onSelectWord(node.id);
    } else {
      setExpanded((prev) => !prev);
    }
  }, [isLeaf, node.id, onSelectWord]);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Vertical connector line for nested items */}
      {level > 0 && (
        <Box
          sx={{
            position: "absolute",
            left: level * INDENT_PX - CONNECTOR_LEFT_OFFSET,
            top: 0,
            bottom: 0,
            width: "1px",
            bgcolor: "rgba(255,255,255,0.1)",
          }}
        />
      )}

      {/* Node row */}
      <Box
        onClick={handleToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          pl: `${level * INDENT_PX}px`,
          pr: 1,
          py: 0.5,
          cursor: "pointer",
          borderRadius: 1,
          bgcolor: isSelected ? "rgba(12, 68, 174, 0.15)" : "transparent",
          "&:hover": {
            bgcolor: isSelected
              ? "rgba(12, 68, 174, 0.22)"
              : "rgba(255,255,255,0.05)",
          },
          transition: "background-color 0.15s ease",
        }}
      >
        {/* Expand/collapse icon or spacer */}
        {!isLeaf ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            sx={{
              width: 24,
              height: 24,
              mr: 0.5,
              color: "grey.400",
            }}
          >
            {expanded ? (
              <ExpandMore sx={{ fontSize: 18 }} />
            ) : (
              <ChevronRight sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        ) : (
          <Box sx={{ width: 24, mr: 0.5 }} />
        )}

        {/* Node label */}
        <Typography
          sx={{
            flex: 1,
            fontSize: "0.875rem",
            fontWeight: isLeaf ? 400 : 600,
            color: isSelected ? "primary.light" : isLeaf ? "common.white" : "common.white",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.name_kh || node.name_en}
        </Typography>

        {/* Pending count badge */}
        {hasPending && (
          <Badge
            badgeContent={node.pending_count}
            color="warning"
            max={99}
            sx={{
              ml: 1,
              "& .MuiBadge-badge": {
                fontSize: "0.6875rem",
                fontWeight: 700,
                minWidth: 18,
                height: 18,
              },
            }}
          />
        )}
      </Box>

      {/* Children (collapsible) */}
      {!isLeaf && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box>
            {node.children.map((child) => (
              <ContributionTreeNodeComponent
                key={`${child.node_type}-${child.id}`}
                node={child}
                level={level + 1}
                selectedWordId={selectedWordId}
                onSelectWord={onSelectWord}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
