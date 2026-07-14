"use client";

import "@fontsource-variable/dm-sans";

import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { createAdminTheme } from "./adminTheme";
import { useAdminThemeStore } from "../store/adminTheme.store";

interface AdminThemeProviderProps {
  children: React.ReactNode;
}

export default function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  const mode = useAdminThemeStore((s) => s.mode);
  const theme = useMemo(() => createAdminTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
