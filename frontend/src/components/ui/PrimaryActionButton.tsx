"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Button from "@mui/material/Button";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

type PrimaryActionButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
};

export default function PrimaryActionButton({
  label,
  onClick,
  disabled = false,
  fullWidth = false,
  type = "button",
}: PrimaryActionButtonProps) {
  return (
    <Button
      type={type}
      variant="contained"
      disabled={disabled}
      onClick={onClick}
      endIcon={
        <ArrowForwardIcon
          sx={{
            bgcolor: KslColors.secondary,
            color: "white",
            borderRadius: "50%",
            p: 0.5,
            fontSize: KslFontSizes.lg,
          }}
        />
      }
      sx={{
        bgcolor: "background.paper",
        color: KslColors.secondary,
        minHeight: 72,
        px: 2,
        py: 1.5,
        borderRadius: `${KslRadii.button}px`,
        boxShadow: KslShadows.card,
        fontSize: KslFontSizes.lg,
        fontWeight: 700,
        textShadow: KslShadows.text,
        width: fullWidth ? "100%" : { xs: "100%", md: 418 },
        maxWidth: 418,
        "&:hover": {
          bgcolor: "background.paper",
          boxShadow: KslShadows.button,
        },
        "&.Mui-disabled": {
          bgcolor: "grey.100",
          color: "text.disabled",
        },
      }}
    >
      {label}
    </Button>
  );
}
