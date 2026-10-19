"use client";

import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

import { statusTone } from "../../theme/tones";

export interface StatsCardProps {
  title: string;
  value: string | number;
  /** undefined hides the chip; null shows `newLabel` (no baseline last period). */
  change?: number | null;
  changeUnit?: "percent" | "points";
  newLabel?: string;
  subtitle?: string;
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
  changeUnit = "percent",
  newLabel,
  subtitle,
  icon,
  chart,
  sx,
}: StatsCardProps) {
  const unit = changeUnit === "points" ? " pts" : "%";
  return (
    <Card elevation={0} sx={{ p: 0, width: "100%", height: "100%", ...sx }}>
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
              {title}
            </Typography>

            <Typography variant="h4" sx={{ mb: 1 }}>
              {formatValue(value)}
            </Typography>

            {change === null && newLabel && (
              <Chip
                size="small"
                label={newLabel}
                sx={{ fontWeight: 700, fontSize: "0.75rem", borderRadius: "6px" }}
              />
            )}

            {change !== undefined && change !== null && (
              <Chip
                size="small"
                icon={change >= 0 ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
                label={`${change >= 0 ? "+" : ""}${change}${unit}`}
                sx={(theme) => ({
                  ...statusTone(theme, change >= 0 ? "success" : "error"),
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                  "& .MuiChip-icon": {
                    color: "inherit",
                  },
                })}
              />
            )}

            {subtitle && (
              <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                {subtitle}
              </Typography>
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
