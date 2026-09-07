"use client";

import { useRef, useState } from "react";
import { Box } from "@mui/material";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";
import type { WdExerciseMediaData } from "../../types/exercise";

type WdExerciseMediaProps = {
  media: WdExerciseMediaData | null;
  alt?: string;
  size?: number;
  reviewState?: "correct" | "incorrect" | "neutral";
};

export default function WdExerciseMedia({
  media,
  alt = "Sign",
  size = 200,
  reviewState = "neutral",
}: WdExerciseMediaProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const resolved = media?.file_url
    ? resolveApiAssetUrl(media.file_url) ?? media.file_url
    : null;
  const isVideo = Boolean(resolved) && media?.media_type === "video";

  const borderColor =
    reviewState === "correct"
      ? KslColors.primary
      : reviewState === "incorrect"
        ? KslColors.error
        : "transparent";

  function playOnce(event: React.SyntheticEvent) {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video || isPlaying) return;
    video.currentTime = 0;
    setIsPlaying(true);
    void video.play();
  }

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
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={resolved ?? undefined}
            muted
            playsInline
            preload="metadata"
            onEnded={() => setIsPlaying(false)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {!isPlaying && (
            <Box
              role="button"
              tabIndex={0}
              aria-label="Play video"
              onClick={playOnce}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") playOnce(event);
              }}
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(15, 30, 24, 0.28)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <Box
                sx={{
                  width: Math.max(size * 0.28, 40),
                  height: Math.max(size * 0.28, 40),
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.92)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: KslShadows.card,
                }}
              >
                <Icon
                  icon="mdi:play"
                  width={Math.max(size * 0.14, 20)}
                  color={KslColors.primary}
                />
              </Box>
            </Box>
          )}
        </>
      ) : resolved ? (
        <Image src={resolved} alt={alt} fill style={{ objectFit: "cover" }} unoptimized />
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
