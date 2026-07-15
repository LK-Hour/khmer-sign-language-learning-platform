"use client";

import { Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchWdTree } from "../api/curriculum";
import { useWordDetectionStore } from "../store";
import { useAuthStore } from "@/store/auth.store";
import WordDetectionPageLoading from "./WordDetectionPageLoading";
import WordDetectionTrack from "./WordDetectionTrack";

type FetchState = "idle" | "loading" | "ready" | "error";

/**
 * Loads the word-detection curriculum from the API, hydrates the Zustand
 * store, then renders the track UI. Mirrors FingerSpellingTrackContainer.
 */
export default function WordDetectionTrackContainer() {
  const { t } = useTranslation();
  const setUnits = useWordDetectionStore((s) => s.setUnits);
  const units = useWordDetectionStore((s) => s.units);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isRefreshing = useAuthStore((state) => state.isRefreshing);
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

    void fetchWdTree()
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

  if (isLoading) {
    return <WordDetectionPageLoading />;
  }

  if (fetchState === "error") {
    return (
      <Alert severity="error" sx={{ mx: "auto" }}>
        {t("WORD_DETECTION.TRACK.LOAD_ERROR")}
      </Alert>
    );
  }

  return <WordDetectionTrack units={units} />;
}
