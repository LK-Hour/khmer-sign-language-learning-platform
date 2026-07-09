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

type GuestProgressState = {
  lessons: Record<number, LocalGuestLessonProgress>;
  practiceSummaries: LocalGuestPracticeSummary[];
  completedChapterPracticeIds: number[];
  lastAccessedLessonId: number | null;
  recordLessonCompletion: (lessonId: number, accuracy?: number | null) => void;
  recordPracticeSummary: (summary: Omit<LocalGuestPracticeSummary, "completedAt">) => void;
  recordChapterPracticeComplete: (chapterId: number) => void;
  toImportPayload: () => GuestProgressImportPayload;
  hasProgress: () => boolean;
  clear: () => void;
};

const nowIso = () => new Date().toISOString();

export const useWordDetectionGuestProgressStore = create<GuestProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      practiceSummaries: [],
      completedChapterPracticeIds: [],
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

      recordChapterPracticeComplete: (chapterId) =>
        set((state) => ({
          completedChapterPracticeIds: state.completedChapterPracticeIds.includes(
            chapterId
          )
            ? state.completedChapterPracticeIds
            : [...state.completedChapterPracticeIds, chapterId],
        })),

      toImportPayload: () => {
        const state = get();
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
        };
      },

      hasProgress: () =>
        Object.keys(get().lessons).length > 0 ||
        get().practiceSummaries.length > 0 ||
        get().completedChapterPracticeIds.length > 0 ||
        get().lastAccessedLessonId != null,

      clear: () =>
        set({
          lessons: {},
          practiceSummaries: [],
          completedChapterPracticeIds: [],
          lastAccessedLessonId: null,
        }),
    }),
    {
      name: "word-detection-guest-progress",
    }
  )
);
