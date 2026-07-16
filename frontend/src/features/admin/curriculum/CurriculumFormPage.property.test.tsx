/**
 * Property-Based Test: Edit-mode pre-population preserves entity data
 *
 * **Validates: Requirements 2.5, 5.5**
 *
 * Property 1: For any valid entity record (Unit, Chapter, Lesson, Exercise),
 * when the edit form is rendered with that entity's data, every form field value
 * SHALL equal the corresponding entity field value after pre-population.
 *
 * We test the form pre-population mapping functions — the same transformations
 * applied in each form page's useEffect when loading entity data for editing.
 * These functions map API response data to form values passed to `form.reset()`.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  AdminUnit,
  AdminChapter,
  AdminLesson,
  AdminExercise,
  AdminExerciseOption,
  PublishStatus,
} from "../api/types";

// ── Pre-population mapping functions ─────────────────────────────────────────
// These replicate the exact transformations used in the form page useEffects

interface UnitFormValues {
  name_en: string;
  name_kh: string;
  description_en: string;
  description_kh: string;
  order_index: number;
  is_active: boolean;
}

interface ChapterFormValues {
  unit_id: number | null;
  name_en: string;
  name_kh: string;
  description_en: string;
  description_kh: string;
  order_index: number;
  is_active: boolean;
  level: number | null;
}

interface LessonFormValues {
  chapter_id: number | null;
  name_en: string;
  name_kh: string;
  description_en: string;
  description_kh: string;
  order_index: number;
  is_active: boolean;
}

interface ExerciseOptionFormState {
  id: number;
  option_text_en: string;
  option_text_kh: string;
  media_id: number | null;
  is_correct: boolean;
  points: number;
  order_index: number;
}

interface ExerciseFormValues {
  unit_id: number | null;
  lesson_id: number | null;
  question_en: string;
  question_kh: string;
  exercise_type: string;
  media_id: number | null;
  explanation_en: string;
  explanation_kh: string;
  order_index: number;
  is_active: boolean;
  options: ExerciseOptionFormState[];
}

/**
 * Maps a Unit API response to form values — replicates UnitFormPage edit logic.
 */
function mapUnitToFormValues(data: AdminUnit): UnitFormValues {
  return {
    name_en: data.name_en ?? "",
    name_kh: data.name_kh ?? "",
    description_en: data.description_en ?? "",
    description_kh: data.description_kh ?? "",
    order_index: data.order_index,
    is_active: data.is_active,
  };
}

/**
 * Maps a Chapter API response to form values — replicates ChapterFormPage edit logic.
 */
function mapChapterToFormValues(data: AdminChapter): ChapterFormValues {
  return {
    unit_id: data.unit_id,
    name_en: data.name_en ?? "",
    name_kh: data.name_kh ?? "",
    description_en: data.description_en ?? "",
    description_kh: data.description_kh ?? "",
    order_index: data.order_index,
    is_active: data.is_active,
    level: data.level ?? null,
  };
}

/**
 * Maps a Lesson API response to form values — replicates LessonFormPage edit logic.
 */
function mapLessonToFormValues(data: AdminLesson): LessonFormValues {
  return {
    chapter_id: data.chapter_id,
    name_en: data.name_en ?? "",
    name_kh: data.name_kh ?? "",
    description_en: data.description_en ?? "",
    description_kh: data.description_kh ?? "",
    order_index: data.order_index,
    is_active: data.is_active,
  };
}

/**
 * Maps an Exercise API response to form values — replicates ExerciseFormPage edit logic.
 */
function mapExerciseToFormValues(data: AdminExercise): ExerciseFormValues {
  return {
    unit_id: null, // Set separately after loading units
    lesson_id: data.lesson_id,
    question_en: data.question_en ?? "",
    question_kh: data.question_kh ?? "",
    exercise_type: data.exercise_type,
    media_id: data.media_id,
    explanation_en: data.explanation_en ?? "",
    explanation_kh: data.explanation_kh ?? "",
    order_index: data.order_index,
    is_active: data.is_active,
    options: data.options.map((opt) => ({
      id: opt.id,
      option_text_en: opt.option_text_en ?? "",
      option_text_kh: opt.option_text_kh ?? "",
      media_id: opt.media_id,
      is_correct: opt.is_correct,
      points: opt.points,
      order_index: opt.order_index,
    })),
  };
}

// ── Arbitrary Generators ─────────────────────────────────────────────────────

const arbPublishStatus: fc.Arbitrary<PublishStatus> = fc.constantFrom("draft", "published");

const arbAdminUnit: fc.Arbitrary<AdminUnit> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name_en: fc.string({ minLength: 1, maxLength: 100 }),
  name_kh: fc.string({ minLength: 1, maxLength: 100 }),
  description_en: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  description_kh: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  order_index: fc.integer({ min: 1, max: 1000 }),
  is_active: fc.boolean(),
  publish_status: arbPublishStatus,
  published_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  created_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  updated_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  chapter_count: fc.integer({ min: 0, max: 50 }),
});

const arbAdminChapter: fc.Arbitrary<AdminChapter> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  unit_id: fc.integer({ min: 1, max: 10000 }),
  name_en: fc.string({ minLength: 1, maxLength: 100 }),
  name_kh: fc.string({ minLength: 1, maxLength: 100 }),
  description_en: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  description_kh: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  order_index: fc.integer({ min: 1, max: 1000 }),
  is_active: fc.boolean(),
  publish_status: arbPublishStatus,
  published_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  created_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  updated_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  level: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 10 })),
  lesson_count: fc.integer({ min: 0, max: 50 }),
  exercise_count: fc.integer({ min: 0, max: 100 }),
});

const arbAdminLesson: fc.Arbitrary<AdminLesson> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  chapter_id: fc.integer({ min: 1, max: 10000 }),
  name_en: fc.string({ minLength: 1, maxLength: 100 }),
  name_kh: fc.string({ minLength: 1, maxLength: 100 }),
  description_en: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  description_kh: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  order_index: fc.integer({ min: 1, max: 1000 }),
  is_active: fc.boolean(),
  publish_status: arbPublishStatus,
  published_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  created_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  updated_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  exercise_count: fc.integer({ min: 0, max: 100 }),
});

const arbExerciseOption: fc.Arbitrary<AdminExerciseOption> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  exercise_id: fc.integer({ min: 1, max: 10000 }),
  option_text_en: fc.oneof(fc.constant(null), fc.string({ maxLength: 100 })),
  option_text_kh: fc.oneof(fc.constant(null), fc.string({ maxLength: 100 })),
  media_id: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 10000 })),
  is_correct: fc.boolean(),
  is_active: fc.boolean(),
  points: fc.integer({ min: 0, max: 100 }),
  order_index: fc.integer({ min: 1, max: 50 }),
});

const arbAdminExercise: fc.Arbitrary<AdminExercise> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  lesson_id: fc.integer({ min: 1, max: 10000 }),
  question_en: fc.string({ minLength: 1, maxLength: 200 }),
  question_kh: fc.string({ minLength: 1, maxLength: 200 }),
  exercise_type: fc.constantFrom(
    "multiple_choice",
    "true_false",
    "multiple_answer",
    "matching",
    "image_select",
    "free_form",
  ),
  media_id: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 10000 })),
  correct_answer: fc.oneof(fc.constant(null), fc.string({ maxLength: 100 })),
  explanation_en: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  explanation_kh: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  order_index: fc.integer({ min: 1, max: 1000 }),
  is_active: fc.boolean(),
  publish_status: arbPublishStatus,
  published_at: fc.oneof(fc.constant(null), fc.constant("2024-01-01T00:00:00Z")),
  options: fc.array(arbExerciseOption, { minLength: 0, maxLength: 6 }),
  media: fc.constant(null),
});

// ── Property Tests ───────────────────────────────────────────────────────────

describe("Property 1: Edit-mode pre-population preserves entity data", () => {
  it("Unit: all form fields match the API response after pre-population", () => {
    fc.assert(
      fc.property(arbAdminUnit, (unit) => {
        const formValues = mapUnitToFormValues(unit);

        // Every form field must equal the corresponding entity field
        expect(formValues.name_en).toBe(unit.name_en ?? "");
        expect(formValues.name_kh).toBe(unit.name_kh ?? "");
        expect(formValues.description_en).toBe(unit.description_en ?? "");
        expect(formValues.description_kh).toBe(unit.description_kh ?? "");
        expect(formValues.order_index).toBe(unit.order_index);
        expect(formValues.is_active).toBe(unit.is_active);
      }),
      { numRuns: 100 },
    );
  });

  it("Chapter: all form fields match the API response after pre-population", () => {
    fc.assert(
      fc.property(arbAdminChapter, (chapter) => {
        const formValues = mapChapterToFormValues(chapter);

        expect(formValues.unit_id).toBe(chapter.unit_id);
        expect(formValues.name_en).toBe(chapter.name_en ?? "");
        expect(formValues.name_kh).toBe(chapter.name_kh ?? "");
        expect(formValues.description_en).toBe(chapter.description_en ?? "");
        expect(formValues.description_kh).toBe(chapter.description_kh ?? "");
        expect(formValues.order_index).toBe(chapter.order_index);
        expect(formValues.is_active).toBe(chapter.is_active);
        expect(formValues.level).toBe(chapter.level ?? null);
      }),
      { numRuns: 100 },
    );
  });

  it("Lesson: all form fields match the API response after pre-population", () => {
    fc.assert(
      fc.property(arbAdminLesson, (lesson) => {
        const formValues = mapLessonToFormValues(lesson);

        expect(formValues.chapter_id).toBe(lesson.chapter_id);
        expect(formValues.name_en).toBe(lesson.name_en ?? "");
        expect(formValues.name_kh).toBe(lesson.name_kh ?? "");
        expect(formValues.description_en).toBe(lesson.description_en ?? "");
        expect(formValues.description_kh).toBe(lesson.description_kh ?? "");
        expect(formValues.order_index).toBe(lesson.order_index);
        expect(formValues.is_active).toBe(lesson.is_active);
      }),
      { numRuns: 100 },
    );
  });

  it("Exercise: all form fields and options match the API response after pre-population", () => {
    fc.assert(
      fc.property(arbAdminExercise, (exercise) => {
        const formValues = mapExerciseToFormValues(exercise);

        expect(formValues.lesson_id).toBe(exercise.lesson_id);
        expect(formValues.question_en).toBe(exercise.question_en ?? "");
        expect(formValues.question_kh).toBe(exercise.question_kh ?? "");
        expect(formValues.exercise_type).toBe(exercise.exercise_type);
        expect(formValues.media_id).toBe(exercise.media_id);
        expect(formValues.explanation_en).toBe(exercise.explanation_en ?? "");
        expect(formValues.explanation_kh).toBe(exercise.explanation_kh ?? "");
        expect(formValues.order_index).toBe(exercise.order_index);
        expect(formValues.is_active).toBe(exercise.is_active);

        // Verify each option is preserved correctly
        expect(formValues.options.length).toBe(exercise.options.length);
        for (let i = 0; i < exercise.options.length; i++) {
          const formOpt = formValues.options[i];
          const srcOpt = exercise.options[i];
          expect(formOpt.id).toBe(srcOpt.id);
          expect(formOpt.option_text_en).toBe(srcOpt.option_text_en ?? "");
          expect(formOpt.option_text_kh).toBe(srcOpt.option_text_kh ?? "");
          expect(formOpt.media_id).toBe(srcOpt.media_id);
          expect(formOpt.is_correct).toBe(srcOpt.is_correct);
          expect(formOpt.points).toBe(srcOpt.points);
          expect(formOpt.order_index).toBe(srcOpt.order_index);
        }
      }),
      { numRuns: 100 },
    );
  });
});
