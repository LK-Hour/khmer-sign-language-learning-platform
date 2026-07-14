"use client";

import { useState } from "react";
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
import type { NavItemConfig } from "./navConfig";

interface NavItemProps {
  item: NavItemConfig;
  onNavigate?: () => void;
  depth?: number;
}

const activeStyles = {
  bgcolor: "rgba(12, 68, 174, 0.08)",
  color: "primary.main",
  fontWeight: 700,
  "&:hover": { bgcolor: "rgba(12, 68, 174, 0.12)" },
};

const inactiveStyles = {
  color: "text.secondary",
  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
};

export default function NavItem({ item, onNavigate, depth = 0 }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
  const hasChildren = Boolean(item.children?.length);
  const [open, setOpen] = useState(isActive);

  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren) {
      setOpen((prev) => !prev);
    } else {
      onNavigate?.();
    }
  };

  const linkProps = hasChildren
    ? {}
    : { component: Link, href: item.path };

  return (
    <>
      <ListItemButton
        {...linkProps}
        onClick={handleClick}
        sx={{
          minHeight: 40,
          borderRadius: 1,
          px: 1.5,
          py: 0.5,
          mb: 0.25,
          pl: depth > 0 ? 2 + depth * 2 : 1.5,
          ...(isActive && !hasChildren ? activeStyles : inactiveStyles),
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: 1.5,
            color: "inherit",
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText
          primary={item.title}
          slotProps={{
            primary: {
              sx: {
                fontSize: "0.875rem",
                fontWeight: isActive && !hasChildren ? 700 : 500,
              },
            },
          }}
        />
        {hasChildren && (
          <Box component="span" sx={{ color: "text.disabled", display: "flex" }}>
            {open ? (
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            )}
          </Box>
        )}
      </ListItemButton>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {item.children!.map((child) => (
              <NavItem
                key={child.path}
                item={child}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}
