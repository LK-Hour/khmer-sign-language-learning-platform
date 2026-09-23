// Mode-aware color helpers for tinted surfaces (status chips, active nav rows).
// Light mode keeps the original Minimals values; dark mode swaps dark-on-tint text
// for the lighter palette shade so it stays readable on dark surfaces.

import { alpha, type Theme } from "@mui/material/styles";

export type StatusTone = "success" | "warning" | "info" | "error" | "neutral";

// Base colors for the translucent chip background (independent of theme mode).
const TONE_BASE: Record<StatusTone, string> = {
  success: "#22C55E",
  warning: "#FFAB00",
  info: "#00B8D9",
  error: "#FF5630",
  neutral: "#919EAB",
};

/** Background + text color for a soft status chip, readable in light and dark mode. */
export function statusTone(theme: Theme, tone: StatusTone): { bgcolor: string; color: string } {
  const dark = theme.palette.mode === "dark";
  const { grey, success, warning, info, error } = theme.palette;

  const text: Record<StatusTone, string> = dark
    ? {
        success: success.light,
        warning: warning.light,
        info: info.light,
        error: error.light,
        neutral: grey[400],
      }
    : {
        success: success.dark,
        warning: warning.dark,
        info: info.dark,
        error: "#B71D18",
        neutral: grey[600],
      };

  return { bgcolor: alpha(TONE_BASE[tone], dark ? 0.16 : 0.12), color: text[tone] };
}

/**
 * Translucent primary tint for active/selected rows.
 * Dark mode uses a stronger tint since the lighter primary needs more backing to register.
 */
export function primaryTint(theme: Theme, level: "rest" | "hover" = "rest"): string {
  const dark = theme.palette.mode === "dark";
  const amount = level === "rest" ? (dark ? 0.12 : 0.08) : dark ? 0.2 : 0.12;
  return alpha(theme.palette.primary.main, amount);
}
