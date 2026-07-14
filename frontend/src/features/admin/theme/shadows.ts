import type { Shadows } from "@mui/material/styles";

// Minimals elevation-0 card shadow value
export const CARD_SHADOW =
  "0px 12px 24px -4px rgba(145,158,171,0.12), 0px 0px 2px 0px rgba(145,158,171,0.2)";

// CSS custom property pattern used by MuiCard/MuiPaper overrides.
// Falls back to CARD_SHADOW when --Paper-shadow is not set.
export const PAPER_SHADOW_VAR = `var(--Paper-shadow, ${CARD_SHADOW})`;

/**
 * Custom shadows array for the admin theme.
 *
 * - Index 0: "none" (required by MUI Shadows type)
 * - Index 1: subtle elevation shadow
 * - Indices 2-24: "none" — Minimals uses elevation-0 pattern with
 *   the CSS custom property `--Paper-shadow` instead of MUI's built-in elevation scale.
 */
export const shadows: Shadows = [
  "none", // 0
  "0px 1px 2px 0px rgba(145,158,171,0.16)", // 1
  "none", // 2
  "none", // 3
  "none", // 4
  "none", // 5
  "none", // 6
  "none", // 7
  "none", // 8
  "none", // 9
  "none", // 10
  "none", // 11
  "none", // 12
  "none", // 13
  "none", // 14
  "none", // 15
  "none", // 16
  "none", // 17
  "none", // 18
  "none", // 19
  "none", // 20
  "none", // 21
  "none", // 22
  "none", // 23
  "none", // 24
];
