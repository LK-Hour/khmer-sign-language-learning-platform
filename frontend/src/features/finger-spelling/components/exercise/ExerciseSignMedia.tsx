"use client";

import { Box } from "@mui/material";
import Image from "next/image";
import { KslRadii, KslShadows } from "@/theme/theme";
import { resolveApiAssetUrl } from "../../api/config";

type ExerciseSignMediaProps = {
  url: string | null;
  alt?: string;
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
      ? "#1f9f6f"
      : reviewState === "incorrect"
        ? "#FF4438"
        : "transparent";

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        maxWidth: "100%",
        aspectRatio: "1 / 1",
        borderRadius: `${KslRadii.signImage}px`,
        overflow: "hidden",
        boxShadow: KslShadows.drop,
        border: `3px solid ${borderColor}`,
        bgcolor: "#f0f4f2",
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
