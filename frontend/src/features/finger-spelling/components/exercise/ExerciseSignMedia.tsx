"use client";

import { Box } from "@mui/material";
import Image from "next/image";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";
import { resolveApiAssetUrl } from "../../api/config";

type ExerciseSignMediaProps = {
  url: string | null;
  alt?: string;
  /** Width in px. Height follows landscape aspect ratio. */
  size?: number;
  reviewState?: "correct" | "incorrect" | "neutral";
};

export default function ExerciseSignMedia({
  url,
  alt = "Sign",
  size = 200,
  reviewState = "neutral",
}: ExerciseSignMediaProps) {
  const resolved = url ? resolveApiAssetUrl(url) ?? url : null;

  const borderColor =
    reviewState === "correct"
      ? KslColors.primary
      : reviewState === "incorrect"
        ? KslColors.error
        : "transparent";

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        maxWidth: "100%",
        aspectRatio: "4 / 3",
        borderRadius: `${KslRadii.wordCard}px`,
        overflow: "hidden",
        boxShadow: KslShadows.drop,
        border: `2px solid ${borderColor}`,
        bgcolor: KslColors.primaryLighter,
        flexShrink: 0,
      }}
    >
      {resolved ? (
        <Image
          src={resolved}
          alt={alt}
          fill
          style={{ objectFit: "cover" }}
          unoptimized
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.disabled",
            fontSize: 40,
          }}
        >
          🤟
        </Box>
      )}
    </Box>
  );
}
