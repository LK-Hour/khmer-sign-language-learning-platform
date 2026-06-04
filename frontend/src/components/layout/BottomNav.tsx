"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import { usePathname, useRouter } from "next/navigation";
import { kslColors, kslFontSizes } from "@/theme/theme";

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
    <Box
      component="nav"
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
            color: kslColors.textSecondary,
            minWidth: { xs: 64, md: 120 },
            maxWidth: { xs: 120, md: 240 },
            "&.Mui-selected": {
              color: kslColors.primary,
            },
          },
          "& .MuiBottomNavigationAction-label": {
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: kslFontSizes.sm,
            "&.Mui-selected": {
              fontSize: kslFontSizes.sm,
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
    </Box>
  );
}
