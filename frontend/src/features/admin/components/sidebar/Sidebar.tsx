"use client";

import Link from "next/link";
import { Box, IconButton, List, ListItemButton, ListItemIcon, Stack, Tooltip } from "@mui/material";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SidebarHeader from "./SidebarHeader";
import NavSection from "./NavSection";
import SidebarFooter from "./SidebarFooter";
import { NAV_CONFIG } from "./navConfig";
import { useTranslation } from "@/i18n/useTranslation";

interface SidebarProps {
  width: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ width, collapsed = false, onToggleCollapse, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Gather all top-level items that have icons (for collapsed view)
  const iconItems = NAV_CONFIG.flatMap((section) =>
    section.items.filter((item) => item.icon),
  );

  return (
    <Stack
      sx={{
        width,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        bgcolor: "background.paper",
        borderRight: (theme) => `1px dashed ${theme.palette.divider}`,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        transition: "width 0.3s ease",
        overflow: "visible",
      }}
    >
      {collapsed ? (
        /* ═══ COLLAPSED VIEW ═══ */
        <>
          {/* Logo + expand button row — button sits on the right border edge */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 2, position: "relative" }}>
            <Box sx={{ width: 32, height: 32, position: "relative" }}>
              <Image src="/assets/logo.png" alt="KSL" fill sizes="32px" style={{ objectFit: "contain" }} />
            </Box>

            {/* Expand button — bumps out of the right border */}
            {onToggleCollapse && (
              <Tooltip title="Expand sidebar" placement="right">
                <IconButton
                  onClick={onToggleCollapse}
                  size="small"
                  sx={{
                    position: "absolute",
                    right: -12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 24,
                    height: 24,
                    bgcolor: "background.paper",
                    border: (theme) => `1px dashed ${theme.palette.divider}`,
                    zIndex: (theme) => theme.zIndex.appBar + 2,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ViewSidebarOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Icon-only nav items */}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <List disablePadding sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, px: 1 }}>
              {iconItems.map((item) => {
                const Icon = item.icon!;
                const isActive = item.path
                  ? pathname === item.path || pathname.startsWith(item.path + "/")
                  : false;
                // For parent items, check if any child path matches
                const isParentActive = !item.path && item.children?.some((child) =>
                  child.path ? pathname.startsWith(child.path) : false,
                );

                return (
                  <Tooltip key={item.id} title={t(item.title as Parameters<typeof t>[0])} placement="right">
                    <ListItemButton
                      component={item.path ? Link : "div"}
                      href={item.path || undefined}
                      onClick={onToggleCollapse}
                      sx={{
                        minHeight: 40,
                        width: 40,
                        borderRadius: 1,
                        justifyContent: "center",
                        px: 0,
                        color: isActive || isParentActive ? "primary.main" : "text.secondary",
                        bgcolor: isActive || isParentActive ? "rgba(12, 68, 174, 0.08)" : "transparent",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, color: "inherit" }}>
                        <Icon sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </List>
          </Box>

          {/* Back to site icon */}
          <Box sx={{ display: "flex", justifyContent: "center", py: 2, borderTop: (theme) => `1px dashed ${theme.palette.divider}` }}>
            <Tooltip title="Back to site" placement="right">
              <IconButton component={Link} href="/" size="small" sx={{ color: "text.secondary" }}>
                <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        /* ═══ EXPANDED VIEW ═══ */
        <>
          {/* Header + toggle button */}
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", pr: 1 }}>
            <SidebarHeader />
            {onToggleCollapse && (
              <Tooltip title="Collapse sidebar">
                <IconButton onClick={onToggleCollapse} size="small">
                  <MenuOpenRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Scrollable navigation */}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <SimpleBar style={{ maxHeight: "100%" }}>
              <Stack sx={{ px: 2, py: 1 }}>
                {NAV_CONFIG.map((section) => (
                  <NavSection key={section.title} section={section} onNavigate={onNavigate} />
                ))}
              </Stack>
            </SimpleBar>
          </Box>

          <SidebarFooter />
        </>
      )}
    </Stack>
  );
}
