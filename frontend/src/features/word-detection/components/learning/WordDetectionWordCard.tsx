"use client";

import { Stack } from "@mui/material";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";

type WdWordCardProps = {
  videoUrl: string;
  wordEn: string;
};

export default function WdWordCard({ videoUrl, wordEn }: WdWordCardProps) {
  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: `${KslRadii.signImage}px`,
        overflow: "hidden",
        boxShadow: KslShadows.drop,
        bgcolor: KslColors.primaryLight,
      }}
    >
      <video
        src={videoUrl}
        controls
        playsInline
        loop
        aria-label={`Sign language video sample for ${wordEn}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </Stack>
  );
}
