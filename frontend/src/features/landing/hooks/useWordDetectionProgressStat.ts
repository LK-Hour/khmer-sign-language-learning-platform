"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatLessonProgressStat,
  sumLessonProgress,
} from "@/features/finger-spelling/utils/lessonProgressSummary";
import { fetchWdUnits } from "@/features/word-detection/api/curriculum";
import { useWordDetectionStore } from "@/features/word-detection/store";
import { useWordDetectionGuestProgressStore } from "@/features/word-detection/store/guestProgress.store";
import type { WdUnit } from "@/features/word-detection/types";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";

function trackUnitsToCountSources(
  units: ReturnType<typeof useWordDetectionStore.getState>["units"]
): Pick<WdUnit, "completedLessonCount" | "totalLessonCount">[] {
  return units.map((unit) => ({
    completedLessonCount: unit?.completedLessonCount ?? 0,
    totalLessonCount: unit?.totalLessonCount ?? 0,
  }));
}

export function useWordDetectionProgressStat() {
  const { locale, t } = useTranslation();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const storeUnits = useWordDetectionStore((state) => state.units);
  const guestLessons = useWordDetectionGuestProgressStore((state) => state.lessons);
  const [fetchedUnits, setFetchedUnits] = useState<WdUnit[] | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    let ignore = false;

    void fetchWdUnits()
      .then((units) => {
        if (!ignore) {
          setFetchedUnits(units);
        }
      })
      .catch(() => {
        if (!ignore) {
          setFetchedUnits([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [hasHydrated, user?.id]);

  const progress = useMemo(() => {
    const fetched = sumLessonProgress(fetchedUnits ?? []);
    const stored =
      storeUnits.length > 0
        ? sumLessonProgress(trackUnitsToCountSources(storeUnits))
        : null;

    let completed = Math.max(fetched.completed, stored?.completed ?? 0);
    const total = Math.max(fetched.total, stored?.total ?? 0);

    if (user?.is_guest) {
      const guestCompleted = Object.values(guestLessons).filter(
        (lesson) => lesson?.isCompleted
      ).length;
      completed = Math.max(completed, guestCompleted);
    }

    return { completed, total };
  }, [fetchedUnits, guestLessons, storeUnits, user?.is_guest]);

  const stat = useMemo(() => {
    if (!hasHydrated || fetchedUnits == null || progress.total === 0) {
      return t("HOME.WORD_DETECTION_STAT_LOADING");
    }

    const { completed, total } = formatLessonProgressStat(
      progress.completed,
      progress.total,
      locale
    );

    return `${completed}/${total} ${t("PHRASES.LESSONS")}`;
  }, [fetchedUnits, hasHydrated, locale, progress.completed, progress.total, t]);

  return {
    stat,
    isLoading: !hasHydrated || fetchedUnits == null,
    ...progress,
  };
}
