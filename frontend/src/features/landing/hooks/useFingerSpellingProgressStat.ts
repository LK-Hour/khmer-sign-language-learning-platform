"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchFsUnits } from "@/features/finger-spelling/api/curriculum";
import { useFingerSpellingStore } from "@/features/finger-spelling/store";
import { useGuestProgressStore } from "@/features/finger-spelling/store/guestProgress.store";
import {
  formatLessonProgressStat,
  sumLessonProgress,
  trackUnitsToCountSources,
} from "@/features/finger-spelling/utils/lessonProgressSummary";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";

export function useFingerSpellingProgressStat() {
  const { locale, t } = useTranslation();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const storeUnits = useFingerSpellingStore((state) => state.units);
  const guestLessons = useGuestProgressStore((state) => state.lessons);
  const [fetchedUnits, setFetchedUnits] = useState<
    Awaited<ReturnType<typeof fetchFsUnits>> | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    let ignore = false;
    setIsLoading(true);

    void fetchFsUnits()
      .then((units) => {
        if (!ignore) {
          setFetchedUnits(units);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setFetchedUnits([]);
          setIsLoading(false);
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
    if (!hasHydrated || isLoading || progress.total === 0) {
      return t("HOME.FINGER_SPELLING_STAT_LOADING");
    }

    const { completed, total } = formatLessonProgressStat(
      progress.completed,
      progress.total,
      locale
    );

    return t("HOME.FINGER_SPELLING_STAT", { completed, total });
  }, [hasHydrated, isLoading, locale, progress.completed, progress.total, t]);

  return {
    stat,
    isLoading: !hasHydrated || isLoading,
    ...progress,
  };
}
