"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";
import { Stack, Typography } from "@mui/material";

import { useHandLandmarker } from "@/features/finger-spelling/ml/useHandLandmarker";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

import { buildSentenceModelFeatures } from "../ml/sentenceKeypoints";
import { useSentenceRealtimePredictor } from "../ml/useSentenceRealtimePredictor";

const SAMPLE_INTERVAL_MS = 100;
/** Consecutive frames the live prediction must match the target character
 * before it's confirmed — mirrors the `hold_frames` debounce in the
 * reference `LetterConfirmer` (khmer_realtime_word.py). */
const HOLD_FRAMES_TO_CONFIRM = 6;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

type SentenceSpellingCameraPanelProps = {
  /** The Khmer character the learner is currently signing. */
  targetLabel: string;
  /** Fired once the camera confirms a correct, held match for `targetLabel`. */
  onConfirm: (confidence: number) => void;
  /** Fired once the camera is playing and both the hand landmarker and the
   * prediction socket are ready — i.e. the learner can actually start signing. */
  onReady?: () => void;
};

export default function SentenceSpellingCameraPanel({
  targetLabel,
  onConfirm,
  onReady,
}: SentenceSpellingCameraPanelProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // `cameraError` stays null while the browser permission prompt is open, so
  // readiness is driven by the video's `playing` event instead.
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const { isReady: isLandmarkerReady, detectLandmarks } = useHandLandmarker();
  const { connect, disconnect, sendFeatures, livePrediction, connectionState } =
    useSentenceRealtimePredictor();

  const matchStreakRef = useRef(0);
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsVideoPlaying(false);
    stopStream(streamRef.current);
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("SENTENCE_SPELLING.PRACTICE.CAMERA_UNAVAILABLE"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch {
      setCameraError(t("SENTENCE_SPELLING.PRACTICE.CAMERA_DENIED"));
    }
  }, [t]);

  useEffect(() => {
    // Deferred to a macrotask so React Strict Mode's mount -> immediate
    // cleanup -> remount cycle (dev only) cancels the first, never-started
    // attempt via clearTimeout instead of racing two real getUserMedia calls
    // against each other — same workaround as FingerSpellingCameraPanel.
    const timer = window.setTimeout(() => {
      void startCamera();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      stopStream(streamRef.current);
    };
  }, [startCamera]);

  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isReady =
    isVideoPlaying && isLandmarkerReady && connectionState === "ready" && !cameraError;
  useEffect(() => {
    if (isReady) onReadyRef.current?.();
  }, [isReady]);

  // A new target character starts a fresh streak, so a lingering hold on the
  // previous character can't immediately confirm the next one.
  useEffect(() => {
    matchStreakRef.current = 0;
  }, [targetLabel]);

  useEffect(() => {
    if (!isLandmarkerReady || connectionState !== "ready" || cameraError) {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
      return;
    }

    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    const drawingUtils = ctx ? new DrawingUtils(ctx) : null;

    samplingLoopRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return;

      const detection = detectLandmarks(video);
      const { features, handedness } = buildSentenceModelFeatures(
        detection.landmarks,
        detection.handednesses
      );
      sendFeatures(features, handedness, targetLabel);

      if (canvas && ctx && drawingUtils) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const landmarks of detection.landmarks) {
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
    }, SAMPLE_INTERVAL_MS);

    return () => {
      if (samplingLoopRef.current) {
        clearInterval(samplingLoopRef.current);
        samplingLoopRef.current = null;
      }
      ctx?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);
    };
  }, [isLandmarkerReady, connectionState, cameraError, detectLandmarks, sendFeatures, targetLabel]);

  useEffect(() => {
    if (livePrediction.labelMatches) {
      matchStreakRef.current += 1;
    } else {
      matchStreakRef.current = 0;
    }

    if (matchStreakRef.current >= HOLD_FRAMES_TO_CONFIRM) {
      matchStreakRef.current = 0;
      onConfirmRef.current(livePrediction.confidence);
    }
  }, [livePrediction]);

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.signImage}px`,
        overflow: "hidden",
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
            onPlaying={() => setIsVideoPlaying(true)}
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
        <Stack sx={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", px: 3 }}>
          <Typography sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.sm, textAlign: "center" }}>
            {cameraError}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
