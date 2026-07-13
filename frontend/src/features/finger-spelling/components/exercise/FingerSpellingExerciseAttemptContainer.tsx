"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { ROUTES } from "@/constants/routes";
import { KslColors, KslFontSizes } from "@/theme/theme";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";
import {
  fetchFsExerciseSession,
  fetchFsGuestExerciseSession,
  fetchFsTrackUnits,
  fetchFsUnits,
} from "../../api/curriculum";
import { useGuestProgressStore } from "../../store/guestProgress.store";
import type { ExerciseSessionData } from "../../types/exercise";
import { applyGuestProgress } from "../../utils/guestProgressMerge";
import ExerciseAttemptView from "./ExerciseAttemptView";

type Props = {
  unitId: number;
};

export default function FingerSpellingExerciseAttemptContainer({ unitId }: Props) {
  const router = useRouter();
  const { locale } = useTranslation();
  const isGuest = useAuthStore((state) => state.user?.is_guest === true);
  const [session, setSession] = useState<ExerciseSessionData | null>(null);
  const [unitTitle, setUnitTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (isGuest) {
          const trackUnits = applyGuestProgress(await fetchFsTrackUnits());
          const unit = trackUnits.find((u) => u.id === unitId);
          if (!unit?.isExerciseUnlocked) {
            if (!cancelled) {
              setError(
                "This exercise is locked. Complete all lessons in the unit first."
              );
            }
            return;
          }
          const sess = await fetchFsGuestExerciseSession(unitId);
          if (cancelled) return;
          setSession(sess);
          setUnitTitle(
            locale === "kh"
              ? unit.titleKh || unit.title
              : unit.title
          );
          return;
        }

        const [sess, unit] = await Promise.all([
          fetchFsExerciseSession(unitId),
          fetchFsUnits().then((units) => units.find((u) => u.id === unitId)),
        ]);
        if (cancelled) return;
        setSession(sess);
        setUnitTitle(
          unit
            ? locale === "kh"
              ? unit.titleKh || unit.title
              : unit.title
            : "Unit Exercise"
        );
      } catch (e: unknown) {
        if (cancelled) return;
        const status = (e as { status?: number })?.status;
        if (status === 403) {
          setError(
            "This exercise is locked. Complete all lessons in the unit first."
          );
        } else {
          setError("Failed to load exercise. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [unitId, locale, isGuest]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: KslColors.primary }} />
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography sx={{ fontSize: KslFontSizes.md, color: KslColors.textSecondary, mb: 3 }}>
          {error ?? "Exercise not available."}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Icon icon="solar:arrow-left-linear" />}
          onClick={() => router.push(ROUTES.fingerSpelling.exercises)}
          sx={{ borderColor: KslColors.border, color: KslColors.textPrimary }}
        >
          Back to Exercise List
        </Button>
      </Box>
    );
  }

  return (
    <ExerciseAttemptView
      session={session}
      unitId={unitId}
      unitTitle={unitTitle}
      isGuest={isGuest}
      onGuestCompleted={(result) => {
        useGuestProgressStore.getState().recordUnitExerciseCompletion({
          unitId,
          score: result.score,
          maxScore: result.max_score,
          questionIds: result.questions.map((q) => q.exercise_id),
        });
      }}
    />
  );
}
