// Admin MUI theme composing palette, typography, shadows, shape, and component overrides.
// Follows the Minimals UI Kit design language.

import { createTheme, type Theme } from "@mui/material/styles";

import { lightPalette, darkPalette, type AdminPalette } from "./palette";
import { typography } from "./typography";
import { shadows, PAPER_SHADOW_VAR } from "./shadows";

/**
 * Creates a complete MUI theme configured with Minimals design tokens.
 *
 * @param mode - "light" or "dark" palette variant
 * @returns A fully configured MUI Theme object
 */
export function createAdminTheme(mode: "light" | "dark"): Theme {
  const palette: AdminPalette = mode === "light" ? lightPalette : darkPalette;

  return createTheme({
    palette: {
      mode,
      ...palette,
    },
    typography,
    shadows,
    shape: { borderRadius: 8 },
    components: {
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: PAPER_SHADOW_VAR,
            position: "relative",
            zIndex: 0,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: "none" } },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 700,
            textTransform: "none",
          },
          contained: {
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: { root: { borderRadius: 8, fontSize: "0.875rem" } },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 16 } },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 700, fontSize: "0.75rem" },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontSize: "0.6875rem",
            fontWeight: 700,
            textTransform: "uppercase",
            color: palette.text.secondary,
            backgroundColor: palette.background.neutral,
          },
          body: { fontSize: "0.875rem", borderBottomStyle: "dashed" },
        },
      },
    },
  });
}

/** Default admin theme using light mode */
export const adminTheme = createAdminTheme("light");
