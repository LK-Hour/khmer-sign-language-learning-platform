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
      } catch {
        failPracticeSubmission();
        throw new Error("Hand prediction failed");
      }
    },
    [failPracticeSubmission, finishPracticeSubmission, startPracticeSubmission]
  );

  /**
   * Called when user clicks "Continue" after seeing their result.
   * Submits the attempt to the backend and marks lesson completed if threshold met.
   */
  const completePractice = useCallback(async (labelMatched: boolean): Promise<boolean> => {
    const { accuracy, practiceContext } =
      useFingerSpellingStore.getState();
    const lessonId = practiceContext?.lesson?.id;
    const authUser = useAuthStore.getState().user;

    if (lessonId == null) {
      return false;
    }

    // Send confidence only when label matched; otherwise 0
    const finalAccuracy = labelMatched ? (accuracy ?? 0) : 0;

    // Guests: record locally and mark completed
    if (authUser?.is_guest) {
      useGuestProgressStore.getState().recordLessonCompletion(lessonId, finalAccuracy);
      markLessonCompleted(lessonId);
      return true;
    }

    // Already completed via previous attempt
    if (practiceContext?.lesson?.progressStatus === "COMPLETED") {
      markLessonCompleted(lessonId);
      return true;
    }

    // Submit attempt to backend
    try {
      const result = await submitPracticeAttempt(lessonId, {
        accuracy: finalAccuracy,
        label_matched: labelMatched,
      });
      if (result?.lesson_completed) {
        markLessonCompleted(lessonId);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }, [markLessonCompleted]);

  return {
    runPracticePredict,
    completePractice,
  };
}
