"use client";

import { Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { KslFontSizes, KslRadii } from "@/theme/theme";

type LessonWebcamPanelProps = {
  resetKey?: number;
  videoRef?: RefObject<HTMLVideoElement | null>;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function LessonWebcamPanel({
  resetKey = 0,
  videoRef,
}: LessonWebcamPanelProps) {
  const { t } = useTranslation();
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      internalVideoRef.current = node;
      if (videoRef) {
        videoRef.current = node;
      }
    },
    [videoRef]
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopStream(streamRef.current);
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("fsCameraUnavailable"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;

      const video = internalVideoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch {
      setCameraError(t("fsCameraDenied"));
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      stopStream(streamRef.current);
    };
  }, [startCamera, resetKey]);

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: `${KslRadii.signImage}px`,
        overflow: "hidden",
        bgcolor: "grey.900",
      }}
    >
      {!cameraError ? (
        <video
          ref={setVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
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
            variant="body2"
            color="common.white"
            sx={{ fontSize: KslFontSizes.md, textAlign: "center" }}
          >
            {cameraError}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
