"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { NavTreeNodeConfig } from "./navTypes";
import { useTranslation } from "@/i18n/useTranslation";

import DynamicContributionNav from "./DynamicContributionNav";
import DynamicQuizNav from "./DynamicQuizNav";

export interface NavTreeItemProps {
  node: NavTreeNodeConfig;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onNavigate?: () => void;
  /** Whether this item is the last sibling in its group */
  isLast?: boolean;
}

const activeStyles = {
  bgcolor: "rgba(12, 68, 174, 0.08)",
  color: "primary.main",
  fontWeight: 700,
  "&:hover": { bgcolor: "rgba(12, 68, 174, 0.12)" },
};

const expandedStyles = {
  bgcolor: "action.hover",
  color: "text.primary",
  fontWeight: 600,
  "&:hover": { bgcolor: "action.selected" },
};

const inactiveStyles = {
  color: "text.secondary",
  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
};

export default function NavTreeItem({
  node,
  depth,
  expandedIds,
  onToggle,
  onNavigate,
  isLast = false,
}: NavTreeItemProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isLeaf = Boolean(node.path) && !node.children && !node.dynamic;
  const isParent = Boolean(node.children) || Boolean(node.dynamic);
  const isExpanded = expandedIds.has(node.id);
  const isActive = isLeaf && pathname === node.path;

  const Icon = node.icon;
  const translatedTitle = t(node.title as Parameters<typeof t>[0]);

  // Tree line offset: items at depth > 0 show connector lines
  const showConnector = depth > 0;
  // Position the vertical line under the parent's icon center
  const connectorLeft = depth * 1.5; // spacing units from left edge
  // Fixed row height (matches ListItemButton minHeight) so the branch elbow
  // and the "stop at last child" cut-off stay pinned to this item's own row,
  // regardless of how tall its expanded descendants render below it.
  const ROW_HEIGHT = 40;
  const ROW_CENTER = ROW_HEIGHT / 2;

  const handleClick = () => {
    if (isParent) {
      onToggle(node.id);
    } else if (isLeaf) {
      onNavigate?.();
    }
  };

  // For leaf nodes, wrap in next/link for client-side navigation
  const linkProps = isLeaf ? { component: Link, href: node.path! } : {};

  return (
    // Outer container wraps BOTH this item's row and its expanded children,
    // so the trunk line for a non-last sibling stretches across the entire
    // expanded subtree height instead of stopping at the row's own bottom.
    <Box sx={{ position: "relative" }}>
      {/* Vertical trunk: full height for non-last siblings (so it reaches the
          next sibling below, however tall this node's expanded children are),
          or cut off at this row's own center for the last sibling. */}
      {showConnector && (
        <Box
          sx={{
            position: "absolute",
            left: (theme) => theme.spacing(connectorLeft),
            top: 0,
            height: isLast ? ROW_CENTER : "100%",
            width: 0,
            borderLeft: "1.5px solid",
            borderColor: "divider",
          }}
        />
      )}

      {/* Horizontal branch: a straight line from the trunk to the item text,
          pinned at row center. No borderLeft needed — the trunk already covers
          that vertical span, so adding borderLeft here would double-up. */}
      {showConnector && (
        <Box
          sx={{
            position: "absolute",
            left: (theme) => theme.spacing(connectorLeft),
            top: ROW_CENTER,
            width: 14,
            height: 0,
            borderBottom: "1.5px solid",
            borderColor: "divider",
          }}
        />
      )}

      <Box sx={{ position: "relative", pb: isParent && isExpanded ? 0.5 : 0 }}>
        <ListItemButton
          {...linkProps}
          onClick={handleClick}
          sx={{
            minHeight: ROW_HEIGHT,
            borderRadius: 1,
            px: 1.5,
            py: 0.25,
            pl: showConnector ? connectorLeft + 2.5 : 1.5 + depth * 1.5,
            ...(isActive ? activeStyles : isParent && isExpanded ? expandedStyles : inactiveStyles),
          }}
        >
          {Icon && (
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 1.5,
                color: "inherit",
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </ListItemIcon>
          )}
          <ListItemText
            primary={translatedTitle}
            slotProps={{
              primary: {
                sx: {
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 700 : 500,
                },
              },
            }}
          />
          {isParent && (
            <Box component="span" sx={{ color: "text.disabled", display: "flex" }}>
              {isExpanded ? (
                <ExpandMoreIcon sx={{ fontSize: 18 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              )}
            </Box>
          )}
        </ListItemButton>
      </Box>

      {/* Render children for parent nodes, inside the same relative container
          as the trunk line above so the trunk spans across them. */}
      {isParent && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {node.dynamic === "contribution-tree" ? (
              <DynamicContributionNav
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onNavigate={onNavigate}
              />
            ) : node.dynamic === "quiz-finger" ? (
              <DynamicQuizNav
                track="finger"
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onNavigate={onNavigate}
              />
            ) : node.dynamic === "quiz-word" ? (
              <DynamicQuizNav
                track="word_detection"
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onNavigate={onNavigate}
              />
            ) : (
              node.children?.map((child, index) => (
                <NavTreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onNavigate={onNavigate}
                  isLast={index === (node.children!.length - 1)}
                />
              ))
            )}
          </List>
        </Collapse>
      )}
    </Box>
  );
}
