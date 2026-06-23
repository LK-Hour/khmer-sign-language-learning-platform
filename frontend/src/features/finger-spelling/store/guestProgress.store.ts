import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GuestProgressImportPayload } from "@/features/auth/api/auth";

export type LocalGuestLessonProgress = {
  lessonId: number;
  isCompleted: boolean;
  attempts: number;
  peakAccuracy: number | null;
  totalTimeSpent: number;
  startedAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string | null;
};

export type LocalGuestPracticeSummary = {
  lessonId: number;
  attempts: number;
  bestAccuracy: number | null;
  totalTimeSpent: number;
  completedAt: string | null;
};

type GuestProgressState = {
  lessons: Record<number, LocalGuestLessonProgress>;
  practiceSummaries: LocalGuestPracticeSummary[];
  lastAccessedLessonId: number | null;
  recordLessonCompletion: (lessonId: number, accuracy?: number | null) => void;
  recordPracticeSummary: (summary: Omit<LocalGuestPracticeSummary, "completedAt">) => void;
  toImportPayload: () => GuestProgressImportPayload;
  hasProgress: () => boolean;
  clear: () => void;
};

const nowIso = () => new Date().toISOString();

export const useGuestProgressStore = create<GuestProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      practiceSummaries: [],
      lastAccessedLessonId: null,

      recordLessonCompletion: (lessonId, accuracy = null) =>
        set((state) => {
          const existing = state.lessons[lessonId];
          const timestamp = nowIso();
          return {
            lessons: {
              ...state.lessons,
              [lessonId]: {
                lessonId,
                isCompleted: true,
                attempts: (existing?.attempts ?? 0) + 1,
                peakAccuracy:
                  accuracy == null
                    ? existing?.peakAccuracy ?? null
                    : Math.max(existing?.peakAccuracy ?? 0, accuracy),
                totalTimeSpent: existing?.totalTimeSpent ?? 0,
                startedAt: existing?.startedAt ?? timestamp,
                completedAt: existing?.completedAt ?? timestamp,
                lastAccessedAt: timestamp,
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

      toImportPayload: () => {
        const state = get();
        return {
          lessons: Object.values(state.lessons).map((lesson) => ({
            lesson_id: lesson?.lessonId,
            is_completed: lesson?.isCompleted,
            attempts: lesson?.attempts,
            peak_accuracy: lesson?.peakAccuracy,
            total_time_spent: lesson?.totalTimeSpent,
            started_at: lesson?.startedAt,
            completed_at: lesson?.completedAt,
            last_accessed_at: lesson?.lastAccessedAt,
          })),
          practice_summaries: state.practiceSummaries.map((summary) => ({
            lesson_id: summary?.lessonId,
            attempts: summary?.attempts,
            best_accuracy: summary?.bestAccuracy,
            total_time_spent: summary?.totalTimeSpent,
            completed_at: summary?.completedAt,
          })),
          last_accessed_lesson_id: state.lastAccessedLessonId,
        };
      },

      hasProgress: () =>
        Object.keys(get().lessons).length > 0 ||
        get().practiceSummaries.length > 0 ||
        get().lastAccessedLessonId != null,

      clear: () =>
        set({
          lessons: {},
          practiceSummaries: [],
          lastAccessedLessonId: null,
        }),
    }),
    {
      name: "finger-spelling-guest-progress",
    }
  )
);
