import { useCallback } from "react";
import { submitWdPracticeAttempt } from "../api/practiceSession";
import { useWordDetectionGuestProgressStore } from "../store/guestProgress.store";
import { useAuthStore } from "@/store/auth.store";
import type { WdLessonDetail } from "../types";

/**
 * Word detection practice actions — mirrors useFingerSpellingPracticeActions.
 *
 * `completePractice` is called when the user clicks "Continue" after seeing
 * their result. It records the attempt (backend for signed-in users, local
 * store for guests) and returns whether navigation should proceed.
 */
export function useWordDetectionPracticeActions() {
  const completePractice = useCallback(
    async (
      lesson: WdLessonDetail,
      accuracy: number | null
    ): Promise<boolean> => {
      const lessonId = lesson?.id;
      const authUser = useAuthStore.getState().user;

      if (lessonId == null) {
        console.error("[wd completePractice] lessonId is null");
        return false;
      }

      // Guests: record locally and allow navigation (even if accuracy is low)
      if (authUser?.is_guest) {
        useWordDetectionGuestProgressStore
          .getState()
          .recordLessonCompletion(lessonId, accuracy ?? undefined);
        return true;
      }

      // Already completed via a previous attempt
      if (lesson?.progressStatus === "COMPLETED") {
        return true;
      }

      // Submit attempt to backend
      try {
        await submitWdPracticeAttempt(lessonId, { accuracy });
        // Always navigate forward — lesson stays uncompleted if accuracy < threshold
        return true;
      } catch (error) {
        console.error("[wd completePractice] submit failed:", error);
        return false;
      }
    },
    []
  );

  return { completePractice };
}
