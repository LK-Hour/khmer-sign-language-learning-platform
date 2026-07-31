"use client";

import type { ReactNode } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";

export type ExerciseOptionVisualState =
  | "neutral"
  | "selected"
  | "correct"
  | "incorrect"
  | "active"
  | "paired";

export const exerciseOptionStyleMap: Record<
  ExerciseOptionVisualState,
  { bg: string; border: string; color: string }
> = {
  neutral: {
    bg: KslColors.surface,
    border: KslColors.border,
    color: KslColors.textPrimary,
  },
  selected: {
    bg: KslColors.secondaryLight,
    border: KslColors.secondary,
    color: KslColors.secondary,
  },
  active: {
    bg: KslColors.secondaryLight,
    border: KslColors.secondary,
    color: KslColors.secondary,
  },
  paired: {
    bg: KslColors.primaryLight,
    border: KslColors.primary,
    color: KslColors.primary,
  },
  correct: {
    bg: KslColors.primaryLight,
    border: KslColors.primary,
    color: KslColors.primary,
  },
  incorrect: {
    bg: "#fff0ef",
    border: KslColors.error,
    color: KslColors.error,
  },
};

type Props = {
  state?: ExerciseOptionVisualState;
  interactive?: boolean;
  onClick?: () => void;
  children: ReactNode;
  sx?: SxProps<Theme>;
  ariaLabel?: string;
};

/**
 * Shared selectable option chrome for MC / TF / matching chips.
 * CSS hover/press only (no framer-motion) for snappy taps.
 */
export default function ExerciseOptionCard({
  state = "neutral",
  interactive = true,
  onClick,
  children,
  sx,
  ariaLabel,
}: Props) {
  const style = exerciseOptionStyleMap[state];
  const canInteract = interactive && Boolean(onClick);

  return (
    <Box
      component="button"
      type="button"
      aria-label={ariaLabel}
      onClick={canInteract ? onClick : undefined}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        py: 1.5,
        px: 2,
        borderRadius: `${KslRadii.card}px`,
        border: `2px solid ${style.border}`,
        bgcolor: style.bg,
        color: style.color,
        cursor: canInteract ? "pointer" : "default",
        textAlign: "center",
        transition:
          "border-color 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease, transform 0.08s ease",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
        ...(canInteract && {
          "@media (hover: hover) and (pointer: fine)": {
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: KslShadows.card,
              borderColor:
                state === "neutral" ? KslColors.secondary : style.border,
              bgcolor:
                state === "neutral" ? KslColors.secondaryLighter : style.bg,
            },
          },
          "&:active": {
            transform: "scale(0.97)",
          },
        }),
        "&:focus-visible": {
          outline: `2px solid ${KslColors.secondary}`,
          outlineOffset: 2,
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
