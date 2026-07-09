"use client";

import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { fetchFsChapterPractice } from "../../api/curriculum";
import { useFingerSpellingStore } from "../../store";
import { useGuestProgressStore } from "../../store/guestProgress.store";
import type { FsChapterPractice } from "../../types";
import { isChapterPracticeUnlocked } from "../../utils/chapterPracticeUnlock";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";
import { KslColors, KslFontSizes } from "@/theme/theme";
import ChapterPracticeView from "./ChapterPracticeView";

type FetchState = "idle" | "loading" | "ready" | "error";

type ChapterPracticeContainerProps = {
  chapterId: number;
};

function chapterPracticeUnlockedFromProgress(
  practiceItems: { lessonId: number }[],
  units: ReturnType<typeof useFingerSpellingStore.getState>["units"]
): boolean {
  if (practiceItems.length === 0) return false;

  const chapterLessonIds = new Set(practiceItems.map((item) => item.lessonId));
  const chapter = units
    .flatMap((unit) => unit?.chapters)
    .find((item) =>
      item?.lessons.some((lesson) => chapterLessonIds.has(lesson?.id))
    );

  if (chapter) {
    return isChapterPracticeUnlocked(chapter.lessons, chapter.lessonCount);
  }

  const completedLessons = new Set(
    Object.values(useGuestProgressStore.getState().lessons)
      .filter((lesson) => lesson?.isCompleted)
      .map((lesson) => lesson?.lessonId)
  );

  return practiceItems.every((item) => completedLessons.has(item.lessonId));
}

export default function ChapterPracticeContainer({
  chapterId,
}: ChapterPracticeContainerProps) {
  const { locale, t } = useTranslation();
  const units = useFingerSpellingStore((state) => state.units);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isRefreshing = useAuthStore((state) => state.isRefreshing);

  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [practice, setPractice] = useState<FsChapterPractice | null>(null);

  const authReady =
    hasHydrated &&
    Boolean(user) &&
    !isRefreshing &&
    (user?.is_guest === true || Boolean(token));

  useEffect(() => {
    if (!authReady) return;

    let ignore = false;
    setFetchState("loading");

    void fetchFsChapterPractice(chapterId)
      .then((data) => {
        if (ignore) return;
        if (!data) {
          setFetchState("error");
          return;
        }
        setPractice(data);
        setFetchState("ready");
      })
      .catch(() => {
        if (!ignore) {
          setFetchState("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [authReady, chapterId, user?.id]);

  const isUnlocked = useMemo(() => {
    if (!practice) return false;
    const fromProgress = chapterPracticeUnlockedFromProgress(practice.items, units);
    if (user?.is_guest) return fromProgress;
    return practice.isUnlocked || fromProgress;
  }, [practice, units, user?.is_guest]);

  if (!authReady || fetchState === "idle" || fetchState === "loading") {
    return (
      <Stack
        sx={{
          alignItems: "center",
          justifyContent: "center",
          minHeight: 320,
          py: 8,
        }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (fetchState === "error" || !practice) {
    return (
      <Alert severity="error" sx={{ mx: "auto" }}>
        {t("FINGER_SPELLING.TRACK.LOAD_ERROR")}
      </Alert>
    );
  }

  if (!isUnlocked) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center", py: 8, textAlign: "center" }}>
        <Typography
          variant="h5"
          sx={{ color: KslColors.textPrimary, fontWeight: 700 }}
        >
          {t("FINGER_SPELLING.PRACTICE.LOCKED_TITLE")}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontSize: KslFontSizes.md }}>
          {t("FINGER_SPELLING.PRACTICE.LOCKED_HINT")}
        </Typography>
        <Button
          component={Link}
          href={`/${locale}${ROUTES.fingerSpelling.root}`}
          variant="contained"
          sx={{ fontWeight: 700, mt: 1 }}
        >
          {t("FINGER_SPELLING.PRACTICE.BACK_TO_TRACK")}
        </Button>
      </Stack>
    );
  }

  return <ChapterPracticeView practice={{ ...practice, isUnlocked: true }} />;
}
