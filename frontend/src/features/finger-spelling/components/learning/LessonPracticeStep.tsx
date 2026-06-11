"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import LessonWebcamPanel from "./LessonWebcamPanel";
import SignImageCard from "./SignImageCard";

type LessonPracticeStepProps = {
  letter: string;
  imageUrl: string;
  accuracy: number | null;
  passThreshold: number;
  cameraResetKey: number;
  isSubmitting?: boolean;
  onRetry: () => void;
  onRec: () => void;
  onContinue: () => void;
};

/**
 * Score targets keyed by lesson character.
 * Mirrors the HTML reference app.js lesson data.
 */
const SCORE_TARGETS: Record<string, [number, number, number]> = {
  Ka: [96, 91, 94],
  Kha: [92, 87, 90],
  Ko: [89, 82, 86],
  Kho: [95, 76, 87],
};

const DEFAULT_SCORES: [number, number, number] = [88, 80, 85];

function animateScore(
  setter: (v: number) => void,
  target: number,
  duration = 420
) {
  const start = 0;
  const startedAt = performance.now();
  function tick(now: number) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    setter(Math.round(start + (target - start) * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export default function LessonPracticeStep({
  letter,
  imageUrl,
  accuracy,
  passThreshold,
  cameraResetKey,
  isSubmitting = false,
  onRetry,
  onRec,
  onContinue,
}: LessonPracticeStepProps) {
  const targets = SCORE_TARGETS[letter] ?? DEFAULT_SCORES;
  const [displayScores, setDisplayScores] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animate scores when accuracy becomes available
  useEffect(() => {
    if (accuracy == null || hasAnimated) return;
    setHasAnimated(true);
    animateScore((v) => setDisplayScores((s) => [v, s[1], s[2]]), targets[0]);
    animateScore((v) => setDisplayScores((s) => [s[0], v, s[2]]), targets[1]);
    animateScore((v) => setDisplayScores((s) => [s[0], s[1], v]), targets[2]);
  }, [accuracy, hasAnimated, targets]);

  const passed = accuracy != null && accuracy >= passThreshold;

  const correctionText = passed
    ? "Correct. Your thumb placement is strong. Raise the index finger slightly for a cleaner shape."
    : accuracy != null
      ? "Almost there. Adjust your hand angle and keep the palm closer to the sample."
      : "Press REC to start practice";

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      {/* Practice area: sample + camera side by side */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "0.82fr 1.18fr" },
          gap: 2,
          mt: 2,
        }}
      >
        {/* Sample card */}
        <Box sx={{ display: "grid", gap: 1 }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: `${KslRadii.signImage}px`,
              overflow: "hidden",
              boxShadow: KslShadows.drop,
              bgcolor: "#dce9e3",
              background:
                "linear-gradient(120deg, rgba(255,255,255,0.45), transparent), #dce9e3",
            }}
          >
            <SignImageCard src={imageUrl} alt={`Sign for ${letter}`} />
            {/* Hand keypoint overlay */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                "& .joint": {
                  position: "absolute",
                  zIndex: 2,
                  width: 12,
                  height: 12,
                  border: "2px solid white",
                  borderRadius: "50%",
                  bgcolor: KslColors.primary,
                },
                "& .palm": {
                  width: 16,
                  height: 16,
                },
              }}
            >
              <Box className="joint" sx={{ left: "33%", top: "28%" }} />
              <Box className="joint" sx={{ left: "44%", top: "16%" }} />
              <Box className="joint" sx={{ left: "54%", top: "13%" }} />
              <Box className="joint" sx={{ left: "64%", top: "22%" }} />
              <Box className="joint" sx={{ left: "73%", top: "37%" }} />
              <Box className="joint palm" sx={{ left: "51%", top: "59%" }} />
            </Box>
          </Box>
          <Typography
            sx={{
              color: KslColors.muted,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            Sample image with keypoints
          </Typography>
        </Box>

        {/* Camera card */}
        <Box sx={{ display: "grid", gap: 1 }}>
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
            <LessonWebcamPanel accuracy={accuracy} resetKey={cameraResetKey} />
            {/* Skeleton overlay */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: "34px 22% 64px 28%",
                pointerEvents: "none",
                border: "2px solid rgba(255,255,255,0.75)",
                borderLeft: 0,
                borderBottom: 0,
                borderRadius: 30,
                "& span": {
                  position: "absolute",
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  bgcolor: "#5cf0b4",
                  boxShadow: `0 0 0 5px rgba(92,240,180,0.2)`,
                },
              }}
            >
              <Box component="span" sx={{ left: -8, top: 30 }} />
              <Box component="span" sx={{ left: 28, top: 2 }} />
              <Box component="span" sx={{ right: 24, top: 36 }} />
              <Box component="span" sx={{ right: -8, bottom: 36 }} />
              <Box component="span" sx={{ left: "44%", bottom: -8 }} />
            </Box>
            {/* REC button */}
            <Box
              component="button"
              type="button"
              onClick={accuracy == null ? onRec : onRetry}
              disabled={isSubmitting}
              sx={{
                position: "absolute",
                left: "50%",
                bottom: 18,
                transform: "translateX(-50%)",
                width: 58,
                height: 32,
                border: 0,
                borderRadius: 999,
                color: KslColors.fail,
                bgcolor: "white",
                boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                zIndex: 3,
              }}
            >
              REC
            </Box>
          </Box>
          <Typography
            sx={{
              color: KslColors.muted,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            Live learner camera with keypoint overlay
          </Typography>
        </Box>
      </Box>

      {/* Feedback grid: 3 score cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "0.82fr 0.59fr 0.59fr" },
          gap: 1.5,
          mt: 2,
        }}
      >
        {(
          [
            { label: "Match confidence", key: "match" },
            { label: "Hand angle", key: "angle" },
            { label: "Finger position", key: "position" },
          ] as const
        ).map((item, i) => (
          <Box
            key={item.key}
            sx={{
              p: 2,
              border: 1,
              borderColor: i === 0 && passed ? "rgba(31,159,111,0.28)" : KslColors.border,
              borderRadius: `${KslRadii.card}px`,
              bgcolor:
                i === 0 && passed ? KslColors.primaryLight : "#fbfdfc",
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "block",
                color: KslColors.primaryDark,
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              {displayScores[i]}%
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                color: KslColors.muted,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Correction box */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mt: 2,
          p: 2,
          borderRadius: `${KslRadii.signImage}px`,
          bgcolor: "#f5faf7",
        }}
      >
        <Box>
          <Typography
            component="h4"
            sx={{
              m: 0,
              mb: 0.5,
              fontSize: KslFontSizes.lg,
              fontWeight: 700,
              color: KslColors.textPrimary,
            }}
          >
            Correction result
          </Typography>
          <Typography
            sx={{
              color: KslColors.muted,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {correctionText}
          </Typography>
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onContinue}
          disabled={!passed}
          sx={{
            minWidth: 150,
            minHeight: 46,
            px: 2,
            border: 0,
            borderRadius: `${KslRadii.button}px`,
            color: "white",
            bgcolor: passed ? KslColors.primary : KslColors.disabled,
            fontSize: KslFontSizes.md,
            fontWeight: 800,
            cursor: passed ? "pointer" : "default",
            opacity: passed ? 1 : 0.6,
            transition: "opacity 0.2s, background-color 0.2s",
            "&:hover": passed ? { bgcolor: KslColors.primaryDark } : {},
          }}
        >
          Continue Lesson
        </Box>
      </Box>
    </Box>
  );
}
