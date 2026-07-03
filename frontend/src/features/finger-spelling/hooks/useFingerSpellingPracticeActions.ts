import { useCallback } from "react";
import { predictHandFromFeatures } from "../api/handPredict";
import { submitPracticeAttempt } from "../api/practiceSession";
import {
  useFingerSpellingStore,
} from "../store";
import { useAuthStore } from "@/store/auth.store";
import { useGuestProgressStore } from "../store/guestProgress.store";

export function useFingerSpellingPracticeActions() {
  const startPracticeSubmission = useFingerSpellingStore(
    (state) => state.startPracticeSubmission
  );
  const finishPracticeSubmission = useFingerSpellingStore(
    (state) => state.finishPracticeSubmission
  );
  const failPracticeSubmission = useFingerSpellingStore(
    (state) => state.failPracticeSubmission
  );
  const markLessonCompleted = useFingerSpellingStore(
    (state) => state.markLessonCompleted
  );

  /**
   * Runs ML prediction only — no backend submission.
   * Stores accuracy + predicted letter in the store for display.
   */
  const runPracticePredict = useCallback(
    async (
      letterId: number | undefined,
      lessonId: number,
      features: number[],
      handedness?: string,
      category?: string,
      targetLabel?: string,
    ) => {
      startPracticeSubmission();

      try {
        const prediction = await predictHandFromFeatures(
          features,
          handedness,
          category,
          targetLabel,
        );
        const score = Math.round(prediction?.match_confidence);
        const predicted =
          prediction?.predicted_label ?? String(prediction?.predicted_class_index);

        finishPracticeSubmission({
          accuracy: score,
          predictedLetter: predicted,
        });
      } catch (error) {
        failPracticeSubmission();
        console.error("[runPracticePredict] ML prediction failed:", error);
        throw new Error("Hand prediction failed");
      }
    },
    [failPracticeSubmission, finishPracticeSubmission, startPracticeSubmission]
  );

  /**
   * Called when user clicks "Continue" after seeing their result.
   * Submits the attempt to the backend and marks lesson completed if threshold met.
   */
  const completePractice = useCallback(async (): Promise<boolean> => {
    const { accuracy, practiceContext } =
      useFingerSpellingStore.getState();
    const lessonId = practiceContext?.lesson?.id;
    const authUser = useAuthStore.getState().user;

    console.log("[completePractice] lessonId:", lessonId, "accuracy:", accuracy, "isGuest:", authUser?.is_guest);

    if (lessonId == null) {
      console.error("[completePractice] lessonId is null — practiceContext missing");
      return false;
    }

    // Guests: record locally and mark completed (even if accuracy is low)
    if (authUser?.is_guest) {
      console.log("[completePractice] guest user — recording locally");
      useGuestProgressStore.getState().recordLessonCompletion(lessonId, accuracy ?? undefined);
      markLessonCompleted(lessonId);
      return true;
    }

    // Already completed via previous attempt
    if (practiceContext?.lesson?.progressStatus === "COMPLETED") {
      console.log("[completePractice] lesson already completed");
      markLessonCompleted(lessonId);
      return true;
    }

    // Submit attempt to backend
    try {
      console.log("[completePractice] submitting attempt to backend...");
      const result = await submitPracticeAttempt(lessonId, { accuracy });
      console.log("[completePractice] backend response:", result);
      if (result?.lesson_completed) {
        markLessonCompleted(lessonId);
      }
      // Always navigate forward — lesson stays uncompleted if accuracy < threshold
      return true;
    } catch (error) {
      console.error("[completePractice] submitPracticeAttempt failed:", error);
      return false;
    }
  }, [markLessonCompleted]);

  return {
    runPracticePredict,
    completePractice,
  };
}
