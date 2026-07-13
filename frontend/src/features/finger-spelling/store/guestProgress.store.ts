import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GuestProgressImportPayload } from "@/features/auth/api/auth";

export type LocalGuestLessonProgress = {
  lessonId: number;
  isCompleted: boolean;
  attemptCount: number;
  completedAt: string | null;
  lastPracticedAt: string | null;
};

export type LocalGuestPracticeSummary = {
  lessonId: number;
  attemptCount: number;
  completedAt: string | null;
};

export type LocalGuestChapterPractice = {
  chapterId: number;
  avgScore: number;
  completedAt: string;
};

export type LocalGuestUnitExercise = {
  unitId: number;
  bestScore: number;
  maxScore: number;
  questionIds: number[];
  attemptCount: number;
  completedAt: string;
};

type GuestProgressState = {
  lessons: Record<number, LocalGuestLessonProgress>;
  practiceSummaries: LocalGuestPracticeSummary[];
  /** @deprecated Prefer completedChapterPractices; kept for persist migration. */
  completedChapterPracticeIds: number[];
  completedChapterPractices: Record<number, LocalGuestChapterPractice>;
  unitExercises: Record<number, LocalGuestUnitExercise>;
  lastAccessedLessonId: number | null;
  recordLessonCompletion: (lessonId: number, accuracy?: number | null) => void;
  recordPracticeSummary: (summary: Omit<LocalGuestPracticeSummary, "completedAt">) => void;
  recordChapterPracticeComplete: (chapterId: number, avgScore?: number) => void;
  recordUnitExerciseCompletion: (input: {
    unitId: number;
    score: number;
    maxScore: number;
    questionIds: number[];
  }) => void;
  toImportPayload: () => GuestProgressImportPayload;
  hasProgress: () => boolean;
  clear: () => void;
};

const nowIso = () => new Date().toISOString();

function migrateChapterPractices(
  ids: number[],
  practices: Record<number, LocalGuestChapterPractice>
): Record<number, LocalGuestChapterPractice> {
  if (Object.keys(practices).length > 0) return practices;
  const migrated: Record<number, LocalGuestChapterPractice> = {};
  for (const chapterId of ids) {
    migrated[chapterId] = {
      chapterId,
      avgScore: 0,
      completedAt: nowIso(),
    };
  }
  return migrated;
}

export const useGuestProgressStore = create<GuestProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      practiceSummaries: [],
      completedChapterPracticeIds: [],
      completedChapterPractices: {},
      unitExercises: {},
      lastAccessedLessonId: null,

      recordLessonCompletion: (lessonId) =>
        set((state) => {
          const existing = state.lessons[lessonId];
          const timestamp = nowIso();
          return {
            lessons: {
              ...state.lessons,
              [lessonId]: {
                lessonId,
                isCompleted: true,
                attemptCount: (existing?.attemptCount ?? 0) + 1,
                completedAt: existing?.completedAt ?? timestamp,
                lastPracticedAt: timestamp,
              },
            },
            lastAccessedLessonId: lessonId,
          };
        }),

      recordPracticeSummary: (summary) =>
        set((state) => ({
          practiceSummaries: [
            ...state.practiceSummaries,
            {
              ...summary,
              completedAt: nowIso(),
            },
          ],
          lastAccessedLessonId: summary?.lessonId,
        })),

      recordChapterPracticeComplete: (chapterId, avgScore = 0) =>
        set((state) => {
          const existing = state.completedChapterPractices[chapterId];
          const timestamp = nowIso();
          const nextPractices = {
            ...state.completedChapterPractices,
            [chapterId]: {
              chapterId,
              avgScore: Math.max(existing?.avgScore ?? 0, avgScore),
              completedAt: existing?.completedAt ?? timestamp,
            },
          };
          const nextIds = state.completedChapterPracticeIds.includes(chapterId)
            ? state.completedChapterPracticeIds
            : [...state.completedChapterPracticeIds, chapterId];
          return {
            completedChapterPractices: nextPractices,
            completedChapterPracticeIds: nextIds,
          };
        }),

      recordUnitExerciseCompletion: ({ unitId, score, maxScore, questionIds }) =>
        set((state) => {
          const existing = state.unitExercises[unitId];
          const timestamp = nowIso();
          const bestScore = Math.max(existing?.bestScore ?? 0, score);
          return {
            unitExercises: {
              ...state.unitExercises,
              [unitId]: {
                unitId,
                bestScore,
                maxScore: existing?.maxScore ?? maxScore,
                questionIds:
                  bestScore === score ? questionIds : existing?.questionIds ?? questionIds,
                attemptCount: (existing?.attemptCount ?? 0) + 1,
                completedAt: existing?.completedAt ?? timestamp,
              },
            },
          };
        }),

      toImportPayload: () => {
        const state = get();
        const chapterPractices = migrateChapterPractices(
          state.completedChapterPracticeIds,
          state.completedChapterPractices
        );
        return {
          lessons: Object.values(state.lessons).map((lesson) => ({
            lesson_id: lesson?.lessonId,
            is_completed: lesson?.isCompleted,
            attempt_count: lesson?.attemptCount,
            completed_at: lesson?.completedAt,
          })),
          practice_summaries: state.practiceSummaries.map((summary) => ({
            lesson_id: summary?.lessonId,
            attempt_count: summary?.attemptCount,
            completed_at: summary?.completedAt,
          })),
          last_accessed_lesson_id: state.lastAccessedLessonId,
          chapter_practices: Object.values(chapterPractices).map((practice) => ({
            chapter_id: practice.chapterId,
            avg_score: practice.avgScore,
            completed_at: practice.completedAt,
          })),
          unit_exercises: Object.values(state.unitExercises).map((exercise) => ({
            unit_id: exercise.unitId,
            score: exercise.bestScore,
            max_score: exercise.maxScore,
            question_ids: exercise.questionIds,
            completed_at: exercise.completedAt,
          })),
        };
      },

      hasProgress: () =>
        Object.keys(get().lessons).length > 0 ||
        get().practiceSummaries.length > 0 ||
        get().completedChapterPracticeIds.length > 0 ||
        Object.keys(get().completedChapterPractices).length > 0 ||
        Object.keys(get().unitExercises).length > 0 ||
        get().lastAccessedLessonId != null,

      clear: () =>
        set({
          lessons: {},
          practiceSummaries: [],
          completedChapterPracticeIds: [],
          completedChapterPractices: {},
          unitExercises: {},
          lastAccessedLessonId: null,
        }),
    }),
    {
      name: "finger-spelling-guest-progress",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GuestProgressState>;
        const chapterPractices = migrateChapterPractices(
          p.completedChapterPracticeIds ?? [],
          p.completedChapterPractices ?? {}
        );
        return {
          ...current,
          ...p,
          completedChapterPractices: chapterPractices,
          completedChapterPracticeIds:
            p.completedChapterPracticeIds ??
            Object.keys(chapterPractices).map(Number),
          unitExercises: p.unitExercises ?? {},
        };
      },
    }
  )
);
