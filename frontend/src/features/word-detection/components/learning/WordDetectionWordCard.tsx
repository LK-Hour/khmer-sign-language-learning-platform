"use client";

import { Stack, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import PlayButton from "@/components/ui/PlayButton";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type WdWordCardProps = {
  videoUrl?: string | null;
};

function useVideoThumbnail(src: string) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setThumbnail(null);
    });

    if (!src) return;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = src;

    const captureFrame = () => {
      if (cancelled) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(video, 0, 0, width, height);
      try {
        setThumbnail(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        setThumbnail(null);
      }
    };

    const handleLoadedData = () => {
      if (cancelled) return;

      if (video.readyState >= 2) {
        captureFrame();
        return;
      }
      video.currentTime = 0.01;
    };

    const handleSeeked = () => captureFrame();

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleLoadedData);

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleLoadedData);
      video.src = "";
      canvasRef.current = null;
    };
  }, [src]);

  return thumbnail;
}

export default function WdWordCard({ videoUrl }: WdWordCardProps) {
  const { t } = useTranslation();
  const rawSrc = videoUrl?.trim() ?? "";
  const src = useMemo(() => (rawSrc ? resolveApiAssetUrl(rawSrc) ?? rawSrc : ""), [rawSrc]);
  const thumbnail = useVideoThumbnail(src);
  const [hasStarted, setHasStarted] = useState(false);

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
        "& video": {
          objectFit: "cover",
        },
        "& .react-player__preview": {
          backgroundSize: "cover !important",
        },
      }}
    >
      {src ? (
        <ReactPlayer
          src={src}
          light={thumbnail ?? true}
          playIcon={
            <Stack
              aria-hidden
              sx={{
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                bgcolor: "rgba(0, 0, 0, 0.2)",
              }}
            >
              <PlayButton size={72} />
            </Stack>
          }
          playing={hasStarted}
          muted
          loop
          playsInline
          controls={false}
          width="100%"
          height="100%"
          {...(!hasStarted && {
            onClickPreview: () => setHasStarted(true),
          })}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Stack
          sx={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
          }}
        >
          <Typography
            sx={{
              color: KslColors.textSecondary,
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {t("WORD_DETECTION.LESSON.NO_SAMPLE_VIDEO")}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
