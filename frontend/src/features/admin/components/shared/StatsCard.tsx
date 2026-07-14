"use client";

import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  chart?: ReactNode;
  sx?: SxProps<Theme>;
}

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat().format(value);
  }
  return value;
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
  chart,
  sx,
}: StatsCardProps) {
  return (
    <Card elevation={0} sx={{ p: 0, ...sx }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
              {title}
            </Typography>

            <Typography variant="h4" sx={{ mb: 1 }}>
              {formatValue(value)}
            </Typography>

            {change !== undefined && (
              <Chip
                size="small"
                icon={change >= 0 ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
                label={`${change >= 0 ? "+" : ""}${change}%`}
                sx={{
                  bgcolor: change >= 0 ? "rgba(34, 197, 94, 0.12)" : "rgba(183, 29, 24, 0.12)",
                  color: change >= 0 ? "success.dark" : "error.main",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                  "& .MuiChip-icon": {
                    color: "inherit",
                  },
                }}
              />
            )}
          </Box>

          {(icon || chart) && (
            <Box sx={{ ml: 2 }}>
              {icon ?? chart}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
