import {
  getMockChapter,
  getMockChapters,
  mockUnits,
} from "./mockCurriculum";
import type { FsBackendExercise, FsChapterExercise, FsExercise } from "../types";
import {
  adaptBackendChapterExercise,
  chapterToExercise,
  normalizeChapter,
} from "../api/adapters";

/**
 * Mock exercises in backend `ExerciseResponse` shape so the same adapter
 * used for live API data builds the quiz UI.
 */
export const mockBackendExercises: Record<number, FsBackendExercise[]> = {
  101: [
    {
      id: 10001,
      lesson_id: 1001,
      question_en: "Which letter matches this sign?",
      question_kh: "តើអក្សរណាដែលត្រូវនឹងសញ្ញានេះ?",
      exercise_type: "multiple_choice",
      media_id: null,
      order_index: 1,
      media: {
        id: 1,
        media_type: "image",
        file_url: "/finger-spelling/placeholder-sign.svg",
      },
      options: [
        {
          id: 100011,
          option_text_en: "ka",
          option_text_kh: "ក",
          media_id: null,
          order_index: 1,
          media: null,
        },
        {
          id: 100012,
          option_text_en: "kha",
          option_text_kh: "ខ",
          media_id: null,
          order_index: 2,
          media: null,
        },
      ],
    },
    {
      id: 10002,
      lesson_id: 1002,
      question_en: "Type the letter you see",
      question_kh: "វាយអក្សរដែលអ្នកឃើញ",
      exercise_type: "free_form",
      media_id: null,
      order_index: 2,
      media: {
        id: 2,
        media_type: "image",
        file_url: "/finger-spelling/placeholder-sign.svg",
      },
      options: [
        {
          id: 100021,
          option_text_en: "ka",
          option_text_kh: "ក",
          media_id: null,
          order_index: 1,
          media: null,
        },
      ],
    },
    {
      id: 10003,
      lesson_id: 1003,
      question_en: "Select the sign that matches the letter",
      question_kh: "ជ្រើសសញ្ញាដែលត្រូវនឹងអក្សរ",
      exercise_type: "image_select",
      media_id: null,
      order_index: 3,
      media: null,
      options: [
        {
          id: 100031,
          option_text_en: "ka",
          option_text_kh: "ក",
          media_id: null,
          order_index: 1,
          media: {
            id: 3,
            media_type: "image",
            file_url: "/finger-spelling/placeholder-sign.svg",
          },
        },
        {
          id: 100032,
          option_text_en: "kha",
          option_text_kh: "ខ",
          media_id: null,
          order_index: 2,
          media: {
            id: 4,
            media_type: "image",
            file_url: "/finger-spelling/placeholder-sign.svg",
          },
        },
      ],
    },
  ],
  102: [
    {
      id: 10004,
      lesson_id: 1006,
      question_en: "Which letter matches this sign?",
      question_kh: "តើអក្សរណាដែលត្រូវនឹងសញ្ញានេះ?",
      exercise_type: "multiple_choice",
      media_id: null,
      order_index: 1,
      media: {
        id: 5,
        media_type: "image",
        file_url: "/finger-spelling/placeholder-sign.svg",
      },
      options: [
        {
          id: 100041,
          option_text_en: "ca",
          option_text_kh: "ច",
          media_id: null,
          order_index: 1,
          media: null,
        },
        {
          id: 100042,
          option_text_en: "cha",
          option_text_kh: "ឆ",
          media_id: null,
          order_index: 2,
          media: null,
        },
      ],
    },
  ],
};

/** Mock scoring: first option is the correct answer (dev only). */
export function getMockCorrectOptionId(
  exercise: FsBackendExercise
): number | undefined {
  return exercise.options[0]?.id;
}

export function getMockBackendExercises(
  chapterId: number
): FsBackendExercise[] {
  return mockBackendExercises[chapterId] ?? [];
}

/** Same path as live API: chapter + backend exercises → quiz shell. */
export function getMockChapterExerciseFromBackend(
  chapterId: number
): FsChapterExercise | null {
  const chapter = getMockChapter(chapterId);
  if (!chapter) return null;

  const exercises = getMockBackendExercises(chapterId);
  return adaptBackendChapterExercise(normalizeChapter(chapter), exercises);
}

/** Same path as live API: chapters → exercise list cards. */
export function getMockExercisesFromChapters(): FsExercise[] {
  return mockUnits.flatMap((unit) =>
    getMockChapters(unit.id).map((chapter) => ({
      ...chapterToExercise(normalizeChapter(chapter)),
      unitOrderIndex: unit.orderIndex,
    }))
  );
}
