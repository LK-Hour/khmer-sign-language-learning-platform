"use client";

import { Box, Link, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  action,
  sx,
}: PageHeaderProps) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 3, ...sx }}
    >
      <Box>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
            {breadcrumbs.map((crumb, index) => (
              <Typography
                key={index}
                variant="overline"
                component={crumb.href ? Link : "span"}
                href={crumb.href}
                sx={{
                  color: crumb.href ? "primary.main" : "text.secondary",
                  textDecoration: "none",
                  "&:hover": crumb.href ? { textDecoration: "underline" } : undefined,
                }}
              >
                {crumb.label}
                {index < breadcrumbs.length - 1 && (
                  <Typography component="span" variant="overline" sx={{ mx: 0.5, color: "text.disabled" }}>
                    /
                  </Typography>
                )}
              </Typography>
            ))}
          </Stack>
        )}

        <Typography variant="h4">{title}</Typography>

        {subtitle && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && <Box>{action}</Box>}
    </Stack>
  );
}
