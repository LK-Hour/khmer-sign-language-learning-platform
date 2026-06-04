"use client";

import { useMemo, useState } from "react";

type LessonPhase = "intro" | "practice" | "complete";

export function useLessonSession(lessonIndex: number, totalLessons: number) {
  const [phase, setPhase] = useState<LessonPhase>("intro");

  const progressValue = useMemo(() => {
    if (phase === "complete") return lessonIndex + 1;
    if (phase === "practice") return lessonIndex + 0.75;
    return lessonIndex + 0.25;
  }, [phase, lessonIndex]);

  return {
    phase,
    setPhase,
    progressValue,
    goToPractice: () => setPhase("practice"),
    completeLesson: () => setPhase("complete"),
    retakeLesson: () => setPhase("intro"),
    totalLessons,
  };
}
