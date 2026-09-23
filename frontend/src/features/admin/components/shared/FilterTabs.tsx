"use client";

import { Button, Stack } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export interface FilterTabsProps {
  tabs: Array<{ label: string; count?: number }>;
  activeIndex: number;
  onChange: (index: number) => void;
  sx?: SxProps<Theme>;
}

export default function FilterTabs({
  tabs,
  activeIndex,
  onChange,
  sx,
}: FilterTabsProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", ...sx }}>
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        return (
          <Button
            key={index}
            size="small"
            onClick={() => onChange(index)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              px: 1.5,
              py: 0.5,
              minWidth: "auto",
              // background.neutral / action.selected follow the theme mode; grey.* does not
              // (it stays light in dark mode, which made the inactive labels unreadable).
              bgcolor: isActive ? "primary.main" : "background.neutral",
              color: isActive ? "primary.contrastText" : "text.secondary",
              "&:hover": {
                bgcolor: isActive ? "primary.dark" : "action.selected",
              },
            }}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </Button>
        );
      })}
    </Stack>
  );
}
