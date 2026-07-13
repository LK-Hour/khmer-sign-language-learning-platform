"use client";

import { Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchFsTrackUnits } from "../api/curriculum";
import { useFingerSpellingStore } from "../store";
import { useGuestProgressStore } from "../store/guestProgress.store";
import { useAuthStore } from "@/store/auth.store";
import FingerSpellingPageLoading from "./FingerSpellingPageLoading";
import FingerSpellingTrack from "./FingerSpellingTrack";

type FetchState = "idle" | "loading" | "ready" | "error";

/** Loads curriculum from the API, then renders the track UI. */
export default function FingerSpellingTrackContainer() {
  const { t } = useTranslation();
  const setUnits = useFingerSpellingStore((state) => state.setUnits);
  const units = useFingerSpellingStore((state) => state.units);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isRefreshing = useAuthStore((state) => state.isRefreshing);
  const guestLessons = useGuestProgressStore((state) => state.lessons);
  const guestChapterPractices = useGuestProgressStore(
    (state) => state.completedChapterPractices
  );
  const guestUnitExercises = useGuestProgressStore((state) => state.unitExercises);
  const [fetchState, setFetchState] = useState<FetchState>("idle");

  const authReady =
    hasHydrated &&
    Boolean(user) &&
    !isRefreshing &&
    (user?.is_guest === true || Boolean(token));
  const isLoading =
    !authReady || fetchState === "idle" || fetchState === "loading";

  useEffect(() => {
    if (!authReady) return;

    let ignore = false;

    void fetchFsTrackUnits()
      .then((freshUnits) => {
        if (!ignore) {
          setUnits(freshUnits);
          setFetchState("ready");
        }
      })
      .catch(() => {
        if (!ignore) {
          setFetchState("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [authReady, setUnits, user?.id]);

  useEffect(() => {
    if (!authReady || user?.is_guest !== true) return;
    const currentUnits = useFingerSpellingStore.getState().units;
    if (currentUnits.length === 0) return;
    setUnits(currentUnits);
  }, [authReady, guestChapterPractices, guestLessons, guestUnitExercises, setUnits, user?.is_guest]);

  if (isLoading) {
    return <FingerSpellingPageLoading />;
  }

  if (fetchState === "error") {
    return (
      <Alert severity="error" sx={{ mx: "auto" }}>
        {t("FINGER_SPELLING.TRACK.LOAD_ERROR")}
      </Alert>
    );
  }

  return <FingerSpellingTrack units={units} />;
}
