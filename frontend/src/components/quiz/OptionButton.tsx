"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { kslColors, kslFontSizes, kslRadii, kslShadows } from "@/theme/theme";

type OptionButtonProps = {
  letter: string;
  romanization?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export default function OptionButton({
  letter,
  romanization,
  selected = false,
  onClick,
  disabled = false,
}: OptionButtonProps) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      sx={{
        border: `4px solid ${selected ? kslColors.primary : kslColors.primaryTrack}`,
        borderRadius: `${kslRadii.wordCard}px`,
        boxShadow: kslShadows.button,
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
          borderColor: kslColors.primary,
        },
      }}
    >
      <Typography
        variant="h5"
        component="span"
        sx={{ fontSize: kslFontSizes.lg }}
      >
        {letter}
      </Typography>
      {romanization && (
        <Typography
          component="p"
          variant="body1"
          sx={{
            fontSize: kslFontSizes.md,
            opacity: 0.5,
            color: kslColors.secondary,
            fontWeight: 700,
          }}
        >
          {romanization}
        </Typography>
      )}
    </Box>
  );
}
