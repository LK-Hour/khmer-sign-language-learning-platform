"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordWordTiming } from "../ml/wordTiming";
import type { WdLessonDetail } from "../types";
import { useWordDetectionPracticeActions } from "./useWordDetectionPracticeActions";

type SaveSession = { lessonId: number; saved: boolean; pending: Promise<void> | null; active: boolean };
const newSession = (lessonId: number): SaveSession => ({ lessonId, saved: false, pending: null, active: true });

/** Share the automatic save with Continue; only a confirmed write is saved. */
export function useWordLessonSave(lesson: WdLessonDetail) {
  const { completePractice } = useWordDetectionPracticeActions();
  const sessionRef = useRef<SaveSession>(newSession(lesson.id));
  const [status, setStatus] = useState<{ lessonId: number; value: "idle" | "saving" | "saved" | "error" }>({ lessonId: lesson.id, value: "idle" });
  useEffect(() => {
    if (sessionRef.current.lessonId !== lesson.id) sessionRef.current = newSession(lesson.id);
    const session = sessionRef.current;
    session.active = true;
    return () => { session.active = false; };
  }, [lesson.id]);

  const save = useCallback((accuracy: number, matched: boolean): Promise<void> => {
    if (sessionRef.current.lessonId !== lesson.id) sessionRef.current = newSession(lesson.id);
    const session = sessionRef.current;
    if (session.saved) return Promise.resolve();
    if (session.pending) return session.pending;
    const started = performance.now();
    setStatus({ lessonId: lesson.id, value: "saving" });
    session.pending = completePractice(lesson, accuracy, matched).then((ok) => {
      if (!ok) throw new Error("Progress was not saved");
      session.saved = true;
      if (session.active) setStatus({ lessonId: lesson.id, value: "saved" });
    }).catch((error: unknown) => {
      if (session.active) setStatus({ lessonId: lesson.id, value: "error" });
      throw error;
    }).finally(() => {
      recordWordTiming("progress-save", started);
      session.pending = null;
    });
    return session.pending;
  }, [completePractice, lesson]);

  return { save, status: status.lessonId === lesson.id ? status.value : "idle" };
}
