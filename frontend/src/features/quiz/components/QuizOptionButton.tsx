"use client";

import { Box, Typography } from "@mui/material";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

type QuizOptionButtonProps = {
  letter: string;
  romanization?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export default function QuizOptionButton({
  letter,
  romanization,
  selected = false,
  onClick,
  disabled = false,
}: QuizOptionButtonProps) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      sx={{
        border: `4px solid ${selected ? KslColors.primary : KslColors.primaryTrack}`,
        borderRadius: `${KslRadii.wordCard}px`,
        boxShadow: KslShadows.button,
        px: 4,
        py: 1,
        textAlign: "center",
        bgcolor: "background.paper",
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        maxWidth: 418,
        minHeight: 66,
        transition: "border-color 0.2s, transform 0.2s",
        transform: selected ? "scale(1.02)" : "none",
        "&:hover:not(:disabled)": {
          borderColor: KslColors.primary,
        },
      }}
    >
      <Typography
        variant="h5"
        component="span"
        sx={{ fontSize: KslFontSizes.lg }}
      >
        {letter}
      </Typography>
      {romanization && (
        <Typography
          component="p"
          variant="body1"
          sx={{
            fontSize: KslFontSizes.md,
            opacity: 0.5,
            color: KslColors.secondary,
            fontWeight: 700,
          }}
        >
          {romanization}
        </Typography>
      )}
    </Box>
  );
}
