"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";
import { Stack, Typography } from "@mui/material";

import { buildModelFeatures } from "@/features/finger-spelling/ml/handKeypoints";
import { useHandLandmarker } from "@/features/finger-spelling/ml/useHandLandmarker";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";

import { createMismatchDetector } from "../ml/mismatchDetector";
import { useSentenceRealtimePredictor } from "../ml/useSentenceRealtimePredictor";

const SAMPLE_INTERVAL_MS = 100;
/** Consecutive frames the live prediction must match the target character
 * before it's confirmed-mirrors the `hold_frames` debounce in the
 * reference `LetterConfirmer` (khmer_realtime_word.py). */
const HOLD_FRAMES_TO_CONFIRM = 6;

/** When a wrong sign counts as a fail (drives the fail sound). Tune here. */
const MISMATCH_CONFIG = {
  /** ~0.8 s of a steady wrong sign at the 100 ms sampling rate. */
  holdFrames: 8,
  /** Ignore low-confidence guesses, typically a hand moving between shapes. */
  minConfidence: 60,
  /** At most one fail every 2.5 s, even if the wrong sign is held. */
  cooldownMs: 2500,
  /** Quiet time after a new character appears, while the last sign is released. */
  graceMs: 2000,
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

type SentenceSpellingCameraPanelProps = {
  /** The Khmer character the learner is currently signing. */
  targetLabel: string;
  /** Fired once the camera confirms a correct, held match for `targetLabel`. */
  onConfirm: (confidence: number) => void;
  /** Fired once the camera is playing and both the hand landmarker and the
   * prediction socket are ready-i.e. the learner can actually start signing. */
  onReady?: () => void;
  /** Fired when the learner keeps showing a real sign that isn't `targetLabel`. */
  onMismatch?: () => void;
};

export default function SentenceSpellingCameraPanel({
  targetLabel,
  onConfirm,
  onReady,
  onMismatch,
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
  // Whether the most recently sampled frame had a hand in it.
  const handDetectedRef = useRef(false);
  const samplingLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const onMismatchRef = useRef(onMismatch);
  useEffect(() => {
    onMismatchRef.current = onMismatch;
  }, [onMismatch]);

  const [mismatchDetector] = useState(() => createMismatchDetector(MISMATCH_CONFIG));

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
    // against each other-same workaround as FingerSpellingCameraPanel.
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
    // Also gives a grace period, so still holding the previous character's
    // sign (which no longer matches) isn't reported as a fail.
    mismatchDetector.reset(performance.now());
  }, [targetLabel, mismatchDetector]);

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
      const { features, handedness, handDetected } = buildModelFeatures(
        detection.landmarks,
        detection.handednesses
      );
      handDetectedRef.current = handDetected;
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
      return;
    }

    const isFail = mismatchDetector.update(
      {
        label: livePrediction.label,
        confidence: livePrediction.confidence,
        labelMatches: livePrediction.labelMatches,
        handDetected: handDetectedRef.current,
      },
      performance.now()
    );
    if (isFail) onMismatchRef.current?.();
  }, [livePrediction, mismatchDetector]);

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
