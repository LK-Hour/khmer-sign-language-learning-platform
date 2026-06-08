"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { KslColors, KslFontSizes } from "@/theme/theme";

export type BottomNavItem = {
  key: string;
  label: string;
  href: string;
  icon: SvgIconComponent;
};

type BottomNavProps = {
  items: BottomNavItem[];
  resolveActive: (pathname: string) => string;
};

export default function BottomNav({ items, resolveActive }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const value = resolveActive(pathname);

  return (
    <Paper
      component="nav"
      square
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: { xs: 64, md: 112 },
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(_, href: string) => router.push(href)}
        showLabels
        sx={{
          height: "100%",
          maxWidth: 1920,
          mx: "auto",
          "& .MuiBottomNavigationAction-root": {
            color: KslColors.textSecondary,
            minWidth: { xs: 64, md: 120 },
            maxWidth: { xs: 120, md: 240 },
            "&.Mui-selected": {
              color: KslColors.primary,
            },
          },
          "& .MuiBottomNavigationAction-label": {
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: KslFontSizes.sm,
            "&.Mui-selected": {
              fontSize: KslFontSizes.sm,
            },
          },
        }}
      >
        {items.map(({ key, label, href, icon: Icon }) => (
          <BottomNavigationAction
            key={key}
            label={label}
            value={href}
            icon={<Icon />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
