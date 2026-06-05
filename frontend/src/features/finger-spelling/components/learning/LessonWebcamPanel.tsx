"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  KslColors,
  KslFontSizes,
  KslRadii,
  KslShadows,
} from "@/theme/theme";

type LessonWebcamPanelProps = {
  accuracy: number | null;
  resetKey?: number;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function LessonWebcamPanel({
  accuracy,
  resetKey = 0,
}: LessonWebcamPanelProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsLive(false);
    stopStream(streamRef.current);
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("fsCameraUnavailable"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsLive(true);
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
    <Box sx={{ width: "100%", maxWidth: 552 }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "552 / 508",
          borderRadius: `${KslRadii.signImage}px`,
          overflow: "hidden",
          boxShadow: KslShadows.drop,
          bgcolor: "grey.900",
        }}
      >
        {!cameraError ? (
          <Box
            component="video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
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
          </Box>
        )}

        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 24,
            pointerEvents: "none",
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              width: 32,
              height: 32,
              borderColor: "common.white",
              borderStyle: "solid",
            },
            "&::before": {
              top: 0,
              left: 0,
              borderWidth: "3px 0 0 3px",
            },
            "&::after": {
              top: 0,
              right: 0,
              borderWidth: "3px 3px 0 0",
            },
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 24,
            pointerEvents: "none",
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              width: 32,
              height: 32,
              borderColor: "common.white",
              borderStyle: "solid",
            },
            "&::before": {
              bottom: 72,
              left: 0,
              borderWidth: "0 0 3px 3px",
            },
            "&::after": {
              bottom: 72,
              right: 0,
              borderWidth: "0 3px 3px 0",
            },
          }}
        />

        {isLive && (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: 1,
              bgcolor: "rgba(0,0,0,0.45)",
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "error.main",
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "common.white", fontWeight: 700, letterSpacing: 1 }}
            >
              {t("fsRec")}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            px: 2,
            py: 1.5,
            bgcolor: "rgba(255,255,255,0.92)",
            textAlign: "center",
          }}
        >
          <Typography
            component="span"
            sx={{ fontSize: KslFontSizes.lg, fontWeight: 700, color: KslColors.secondary }}
          >
            {t("fsAccuracy")}{" "}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: KslFontSizes.lg,
              fontWeight: 700,
              color: accuracy != null ? KslColors.success : KslColors.locked,
            }}
          >
            {accuracy != null ? `${accuracy}%` : "—"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
