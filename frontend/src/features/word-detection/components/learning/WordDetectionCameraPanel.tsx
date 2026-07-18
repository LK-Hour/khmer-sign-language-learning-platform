"use client";

import { DrawingUtils, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Stack, Typography } from "@mui/material";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { WordDetectionLandmarks } from "@/features/word-detection/ml/useWordDetectionLandmarker";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

const OVERLAY_DETECTION_INTERVAL_MS = 0;

const EMPTY_DETECTION: WordDetectionLandmarks = {
  poseLandmarks: [],
  handLandmarks: [],
  handDetected: false,
  frameFeatures: new Float32Array(0),
  sequenceFeatures: null,
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function landmarkKey(detection: WordDetectionLandmarks): string {
  const poseKey = detection.poseLandmarks
    .map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`)
    .join("|");
  const handKey = detection.handLandmarks
    .map((hand) => hand.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`).join("|"))
    .join("~");
  return `${poseKey}::${handKey}`;
}

type WordDetectionCameraPanelProps = {
  videoRef?: RefObject<HTMLVideoElement | null>;
  detectLandmarks: (video: HTMLVideoElement) => WordDetectionLandmarks;
  isLandmarkerReady: boolean;
  onDetection?: (detection: WordDetectionLandmarks) => void;
  onRawStreamReady?: (stream: MediaStream | null) => void;
};

export default function WordDetectionCameraPanel({
  videoRef: externalVideoRef,
  detectLandmarks,
  isLandmarkerReady,
  onDetection,
  onRawStreamReady,
}: WordDetectionCameraPanelProps) {
  const { t } = useTranslation();
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef ?? internalVideoRef;
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastDetectionRef = useRef<WordDetectionLandmarks>(EMPTY_DETECTION);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopStream(streamRef.current);
    streamRef.current = null;
    onRawStreamReady?.(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("FINGER_SPELLING.LESSON.CAMERA_UNAVAILABLE"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      onRawStreamReady?.(stream);

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch {
      onRawStreamReady?.(null);
      setCameraError(t("FINGER_SPELLING.LESSON.CAMERA_DENIED"));
    }
  }, [onRawStreamReady, t, videoRef]);

  useEffect(() => {
    const timer = window.setTimeout(() => void startCamera(), 0);
    return () => {
      window.clearTimeout(timer);
      stopStream(streamRef.current);
      onRawStreamReady?.(null);
    };
  }, [onRawStreamReady, startCamera]);

  useEffect(() => {
    if (!isLandmarkerReady || cameraError) return;

    let animationFrame = 0;
    let lastDetectionAt = 0;
    let lastDrawnKey = "";
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const drawingUtils = new DrawingUtils(ctx);

    const drawOverlay = (now: number) => {
      const video = videoRef.current;

      if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
        animationFrame = window.requestAnimationFrame(drawOverlay);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (now - lastDetectionAt >= OVERLAY_DETECTION_INTERVAL_MS) {
        lastDetectionAt = now;
        const detection = detectLandmarks(video);
        lastDetectionRef.current = detection;
        onDetection?.(detection);
      }

      const detection = lastDetectionRef.current;
      const key = landmarkKey(detection);

      if (key !== lastDrawnKey) {
        lastDrawnKey = key;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pose = detection.poseLandmarks;
        if (pose.length > 0) {
          drawingUtils.drawConnectors(pose, PoseLandmarker.POSE_CONNECTIONS, {
            color: "#4dabf7",
            lineWidth: 2,
          });
          drawingUtils.drawLandmarks(pose, {
            color: "#ffffff",
            fillColor: "#4dabf7",
            lineWidth: 1,
            radius: 2.5,
          });
        }

        for (const hand of detection.handLandmarks) {
          drawingUtils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, {
            color: "#21d07a",
            lineWidth: 1.5,
          });
          drawingUtils.drawLandmarks(hand, {
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
      lastDrawnKey = "";
    };
  }, [cameraError, detectLandmarks, isLandmarkerReady, onDetection, videoRef]);

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.signImage}px`,
        bgcolor: KslColors.primaryLighter,
      }}
    >
      {!cameraError ? (
        <>
          <video
            ref={videoRef}
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
