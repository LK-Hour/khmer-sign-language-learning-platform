"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { List, ListSubheader } from "@mui/material";
import NavTreeItem from "./NavTreeItem";
import { findAncestorIds } from "./navUtils";
import { NAV_CONFIG } from "./navConfig";
import type { NavSectionConfig } from "./navConfig";
import { useAdminUiStore } from "../../store/adminUi.store";
import { useTranslation } from "@/i18n/useTranslation";

interface NavSectionProps {
  section: NavSectionConfig;
  onNavigate?: () => void;
}

export default function NavSection({ section, onNavigate }: NavSectionProps) {
  const pathname = usePathname();
  const expandedNavIds = useAdminUiStore((state) => state.expandedNavIds);
  const toggleNavNode = useAdminUiStore((state) => state.toggleNavNode);
  const expandNavNodes = useAdminUiStore((state) => state.expandNavNodes);
  const { t } = useTranslation();

  // Convert string[] to Set<string> for efficient lookup by NavTreeItem
  const expandedIds = useMemo(() => new Set(expandedNavIds), [expandedNavIds]);

  // Auto-expand ancestor nodes on mount to reveal the active leaf
  useEffect(() => {
    // Collect all items across all sections for full tree traversal
    const allItems = NAV_CONFIG.flatMap((s) => s.items);
    const ancestors = findAncestorIds(allItems, pathname);
    if (ancestors.length > 0) {
      expandNavNodes(ancestors);
    }
    // Only run on mount and pathname changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <List
      disablePadding
      subheader={
        <ListSubheader
          disableSticky
          disableGutters
          sx={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            lineHeight: 1.5,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "text.secondary",
            px: 1,
            pt: 2.5,
            pb: 1,
          }}
        >
          {t(section.title as Parameters<typeof t>[0])}
        </ListSubheader>
      }
    >
      {section.items.map((item) => (
        <NavTreeItem
          key={item.id}
          node={item}
          depth={0}
          expandedIds={expandedIds}
          onToggle={toggleNavNode}
          onNavigate={onNavigate}
        />
      ))}
    </List>
  );
}
