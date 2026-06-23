"use client";

import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";
import { Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { RawHandDetection } from "@/features/finger-spelling/ml/useHandLandmarker";
import { useTranslation } from "@/i18n/useTranslation";
import { KslFontSizes, KslRadii } from "@/theme/theme";

type LessonWebcamPanelProps = {
  resetKey?: number;
  videoRef?: RefObject<HTMLVideoElement | null>;
  detectLandmarks: (video: HTMLVideoElement) => RawHandDetection;
  isLandmarkerReady: boolean;
  onDetection?: (detection: RawHandDetection) => void;
};

const EMPTY_DETECTION: RawHandDetection = { landmarks: [], handednesses: [] };
const OVERLAY_DETECTION_INTERVAL_MS = 0;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function LessonWebcamPanel({
  resetKey = 0,
  videoRef,
  detectLandmarks,
  isLandmarkerReady,
  onDetection,
}: LessonWebcamPanelProps) {
  const { t } = useTranslation();
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastDetectionRef = useRef<RawHandDetection>({ landmarks: [], handednesses: [] });
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
      setCameraError(t("FINGER_SPELLING.LESSON.CAMERA_UNAVAILABLE"));
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
      setCameraError(t("FINGER_SPELLING.LESSON.CAMERA_DENIED"));
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

  useEffect(() => {
    if (!isLandmarkerReady || cameraError) return;

    let animationFrame = 0;
    let lastDetectionAt = 0;
    let lastDrawnLandmarks = "";
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const drawingUtils = new DrawingUtils(ctx);

    const drawOverlay = (now: number) => {
      const video = internalVideoRef.current;

      if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
        animationFrame = window.requestAnimationFrame(drawOverlay);
        return;
      }

      // Only resize when dimensions actually change
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Run MediaPipe at a stable cadence. The video still renders at full
      // browser speed, while detection stays light enough for smooth tracking.
      if (now - lastDetectionAt >= OVERLAY_DETECTION_INTERVAL_MS) {
        lastDetectionAt = now;
        lastDetectionRef.current = detectLandmarks(video);
        onDetection?.(lastDetectionRef.current);
      }

      // Only redraw if landmarks changed (avoids flicker)
      const lm = lastDetectionRef.current.landmarks;
      const key = lm.map((h) => h.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join("|")).join("~");
      if (key !== lastDrawnLandmarks) {
        lastDrawnLandmarks = key;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const landmarks of lm) {
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: "#21d07a",
            lineWidth: 1.5,
          });
          drawingUtils.drawLandmarks(landmarks, {
            color: "#ffffff",
            fillColor: "#21d07a",
            lineWidth: 1,
            radius: 2,
          });
        }
      }

      animationFrame = window.requestAnimationFrame(drawOverlay);
    };

    animationFrame = window.requestAnimationFrame(drawOverlay);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastDetectionRef.current = EMPTY_DETECTION;
      onDetection?.(EMPTY_DETECTION);
      lastDrawnLandmarks = "";
    };
  }, [cameraError, detectLandmarks, isLandmarkerReady, onDetection]);

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
        <>
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
              transform: "scaleX(-1)",
            }}
          />
          <canvas
            ref={overlayCanvasRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
              transform: "scaleX(-1)",
            }}
          />
        </>
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
