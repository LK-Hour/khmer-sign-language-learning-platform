import { useCallback } from "react";
import { predictHandFromFeatures } from "../api/handPredict";
import {
  endPracticeSession,
  startPracticeSession,
  submitPracticeLetter,
} from "../api/practiceSession";
import { fetchFsTrackUnits } from "../api/curriculum";
import {
  FS_PASS_THRESHOLD,
  useFingerSpellingStore,
} from "../store";
import { useAuthStore } from "@/store/auth.store";
import { useGuestProgressStore } from "../store/guestProgress.store";

export function useFingerSpellingPracticeActions() {
  const setPracticeSessionId = useFingerSpellingStore(
    (state) => state.setPracticeSessionId
  );
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

  const initializePracticeSession = useCallback(
    async (lessonId: number) => {
      if (useAuthStore.getState().user?.is_guest) {
        setPracticeSessionId(null);
        return;
      }
      try {
        const session = await startPracticeSession(lessonId);
        setPracticeSessionId(session.id);
      } catch {
        setPracticeSessionId(null);
      }
    },
    [setPracticeSessionId]
  );

  const runPracticeRec = useCallback(
    async (lessonId: number, features: number[], handedness?: string) => {
      startPracticeSubmission();

      try {
        const prediction = await predictHandFromFeatures(features, handedness);
        const score = Math.round(prediction.match_confidence);
        const predicted =
          prediction.predicted_label ?? String(prediction.predicted_class_index);

        const sessionId = useFingerSpellingStore.getState().sessionId;
        if (useAuthStore.getState().user?.is_guest) {
          useGuestProgressStore.getState().recordPracticeSummary({
            lessonId,
            attempts: 1,
            bestAccuracy: score,
            totalTimeSpent: 0,
          });
        } else if (sessionId != null) {
          try {
            await submitPracticeLetter(sessionId, {
              letter_id: lessonId,
              accuracy: score,
              attempts: 1,
            });
          } catch {
            // Prediction feedback should still be shown if progress sync fails.
          }
        }

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

  const completePractice = useCallback(async (): Promise<boolean> => {
    const { sessionId, accuracy, practiceContext } =
      useFingerSpellingStore.getState();
    const lessonId = practiceContext?.lesson.id;
    const authUser = useAuthStore.getState().user;

    if (lessonId == null) return false;

    if (authUser?.is_guest) {
      useGuestProgressStore.getState().recordLessonCompletion(lessonId, accuracy);
      markLessonCompleted(lessonId);
      return true;
    }

    if (practiceContext?.lesson.progressStatus === "COMPLETED") {
      markLessonCompleted(lessonId);
      return true;
    }

    if (
      sessionId != null &&
      accuracy != null &&
      accuracy >= FS_PASS_THRESHOLD
    ) {
      try {
        const result = await endPracticeSession(sessionId);
        if (!result.lesson_completed) return false;

        markLessonCompleted(lessonId);

        try {
          const freshUnits = await fetchFsTrackUnits();
          useFingerSpellingStore.getState().setUnits(freshUnits);
        } catch {
          // The lesson is saved; the next track mount will refresh from the database.
        }
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }, [markLessonCompleted]);

  return {
    initializePracticeSession,
    runPracticeRec,
    completePractice,
  };
}
