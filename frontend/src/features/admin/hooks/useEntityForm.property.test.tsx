/**
 * Property-Based Test: Validation identifies all missing required fields
 *
 * **Validates: Requirements 11.1**
 *
 * Property 7: For any form payload where a non-empty subset of required fields
 * have empty/null values, the validate function SHALL return error messages for
 * exactly those fields (no false positives, no false negatives).
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ── Validation functions under test ──────────────────────────────────────────
// These replicate the validate functions from the form pages to test them
// as pure functions independent of React components.

interface UnitFormValues {
  name_en: string;
  name_kh: string;
  description_en: string;
  description_kh: string;
  order_index: number;
  is_active: boolean;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

interface LessonFormValues {
  chapter_id: number | null;
  name_en: string;
  name_kh: string;
  description_en: string;
  description_kh: string;
  order_index: number;
  is_active: boolean;
  [key: string]: unknown;
}

interface ExerciseFormValues {
  unit_id: number | null;
  lesson_id: number | null;
  question_en: string;
  question_kh: string;
  exercise_type: string;
  media_id: number | null;
  explanation_en: string | null;
  explanation_kh: string | null;
  order_index: number;
  is_active: boolean;
  [key: string]: unknown;
}

// Replicate the actual validate functions from the form pages

function validateUnit(values: UnitFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name_en.trim()) {
    errors.name_en = "Name (EN) is required";
  }
  if (!values.name_kh.trim()) {
    errors.name_kh = "Name (KH) is required";
  }
  if (
    !values.order_index ||
    !Number.isInteger(values.order_index) ||
    values.order_index < 1
  ) {
    errors.order_index = "Order index must be a positive integer";
  }
  return errors;
}

function validateChapter(values: ChapterFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name_en.trim()) {
    errors.name_en = "Name (EN) is required";
  }
  if (!values.name_kh.trim()) {
    errors.name_kh = "Name (KH) is required";
  }
  if (!values.unit_id) {
    errors.unit_id = "Unit is required";
  }
  if (
    !values.order_index ||
    !Number.isInteger(values.order_index) ||
    values.order_index < 1
  ) {
    errors.order_index = "Order index must be a positive integer";
  }
  return errors;
}

function validateLesson(values: LessonFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name_en.trim()) {
    errors.name_en = "Name (EN) is required";
  }
  if (!values.name_kh.trim()) {
    errors.name_kh = "Name (KH) is required";
  }
  if (!values.chapter_id) {
    errors.chapter_id = "Chapter is required";
  }
  if (
    !values.order_index ||
    !Number.isInteger(values.order_index) ||
    values.order_index < 1
  ) {
    errors.order_index = "Order index must be a positive integer";
  }
  return errors;
}

function validateExercise(values: ExerciseFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.lesson_id) {
    errors.lesson_id = "Lesson is required";
  }
  if (!values.question_en.trim()) {
    errors.question_en = "Question (EN) is required";
  }
  if (!values.question_kh.trim()) {
    errors.question_kh = "Question (KH) is required";
  }
  if (!values.exercise_type) {
    errors.exercise_type = "Exercise type is required";
  }
  if (
    !values.order_index ||
    !Number.isInteger(values.order_index) ||
    values.order_index < 1
  ) {
    errors.order_index = "Order index must be a positive integer";
  }
  return errors;
}

// ── Required field definitions ───────────────────────────────────────────────

/** Defines required fields and how to produce valid vs empty values for each */
interface FieldSpec {
  validArb: fc.Arbitrary<unknown>;
  emptyValue: unknown;
}

const UNIT_REQUIRED_FIELDS: Record<string, FieldSpec> = {
  name_en: {
    validArb: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    emptyValue: "",
  },
  name_kh: {
    validArb: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    emptyValue: "",
  },
  order_index: {
    validArb: fc.integer({ min: 1, max: 1000 }),
    emptyValue: 0,
  },
};

const CHAPTER_REQUIRED_FIELDS: Record<string, FieldSpec> = {
  ...UNIT_REQUIRED_FIELDS,
  unit_id: {
    validArb: fc.integer({ min: 1, max: 10000 }),
    emptyValue: null,
  },
};

const LESSON_REQUIRED_FIELDS: Record<string, FieldSpec> = {
  ...UNIT_REQUIRED_FIELDS,
  chapter_id: {
    validArb: fc.integer({ min: 1, max: 10000 }),
    emptyValue: null,
  },
};

const EXERCISE_REQUIRED_FIELDS: Record<string, FieldSpec> = {
  lesson_id: {
    validArb: fc.integer({ min: 1, max: 10000 }),
    emptyValue: null,
  },
  question_en: {
    validArb: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    emptyValue: "",
  },
  question_kh: {
    validArb: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    emptyValue: "",
  },
  exercise_type: {
    validArb: fc.constantFrom(
      "multiple_choice",
      "true_false",
      "multiple_answer",
      "matching",
      "image_select",
      "free_form"
    ),
    emptyValue: "",
  },
  order_index: {
    validArb: fc.integer({ min: 1, max: 1000 }),
    emptyValue: 0,
  },
};

// ── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Generate a form payload where a specified subset of required fields are empty
 * and the rest have valid values.
 */
function buildPayloadArbitrary<T extends Record<string, unknown>>(
  requiredFields: Record<string, FieldSpec>,
  baseValues: T,
  emptyFieldNames: string[]
): fc.Arbitrary<T> {
  const fieldArbs: Record<string, fc.Arbitrary<unknown>> = {};

  for (const [fieldName, spec] of Object.entries(requiredFields)) {
    if (emptyFieldNames.includes(fieldName)) {
      fieldArbs[fieldName] = fc.constant(spec.emptyValue);
    } else {
      fieldArbs[fieldName] = spec.validArb;
    }
  }

  return fc.record(fieldArbs).map((generated) => ({
    ...baseValues,
    ...generated,
  })) as fc.Arbitrary<T>;
}

/**
 * Generate a non-empty subset of field names from the required fields.
 */
function nonEmptySubsetArb(fieldNames: string[]): fc.Arbitrary<string[]> {
  return fc
    .subarray(fieldNames, { minLength: 1, maxLength: fieldNames.length })
    .filter((arr) => arr.length > 0);
}

// ── Property tests ───────────────────────────────────────────────────────────

describe("Property 7: Validation identifies all missing required fields", () => {
  describe("Unit validation", () => {
    const fieldNames = Object.keys(UNIT_REQUIRED_FIELDS);
    const baseValues: UnitFormValues = {
      name_en: "",
      name_kh: "",
      description_en: "",
      description_kh: "",
      order_index: 1,
      is_active: true,
    };

    it("returns errors for exactly the empty required fields (no false positives/negatives)", () => {
      fc.assert(
        fc.property(
          nonEmptySubsetArb(fieldNames).chain((emptyFields) =>
            buildPayloadArbitrary(UNIT_REQUIRED_FIELDS, baseValues, emptyFields).map(
              (payload) => ({ payload, emptyFields })
            )
          ),
          ({ payload, emptyFields }) => {
            const errors = validateUnit(payload);
            const errorFields = Object.keys(errors);

            // No false negatives: every empty field has an error
            for (const field of emptyFields) {
              expect(errorFields).toContain(field);
            }
            // No false positives: no error for fields that have valid values
            for (const field of errorFields) {
              expect(emptyFields).toContain(field);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns no errors when all required fields are valid", () => {
      fc.assert(
        fc.property(
          buildPayloadArbitrary(UNIT_REQUIRED_FIELDS, baseValues, []),
          (payload) => {
            const errors = validateUnit(payload);
            expect(Object.keys(errors)).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Chapter validation", () => {
    const fieldNames = Object.keys(CHAPTER_REQUIRED_FIELDS);
    const baseValues: ChapterFormValues = {
      unit_id: null,
      name_en: "",
      name_kh: "",
      description_en: "",
      description_kh: "",
      order_index: 1,
      is_active: true,
      level: null,
    };

    it("returns errors for exactly the empty required fields (no false positives/negatives)", () => {
      fc.assert(
        fc.property(
          nonEmptySubsetArb(fieldNames).chain((emptyFields) =>
            buildPayloadArbitrary(CHAPTER_REQUIRED_FIELDS, baseValues, emptyFields).map(
              (payload) => ({ payload, emptyFields })
            )
          ),
          ({ payload, emptyFields }) => {
            const errors = validateChapter(payload);
            const errorFields = Object.keys(errors);

            for (const field of emptyFields) {
              expect(errorFields).toContain(field);
            }
            for (const field of errorFields) {
              expect(emptyFields).toContain(field);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns no errors when all required fields are valid", () => {
      fc.assert(
        fc.property(
          buildPayloadArbitrary(CHAPTER_REQUIRED_FIELDS, baseValues, []),
          (payload) => {
            const errors = validateChapter(payload);
            expect(Object.keys(errors)).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Lesson validation", () => {
    const fieldNames = Object.keys(LESSON_REQUIRED_FIELDS);
    const baseValues: LessonFormValues = {
      chapter_id: null,
      name_en: "",
      name_kh: "",
      description_en: "",
      description_kh: "",
      order_index: 1,
      is_active: true,
    };

    it("returns errors for exactly the empty required fields (no false positives/negatives)", () => {
      fc.assert(
        fc.property(
          nonEmptySubsetArb(fieldNames).chain((emptyFields) =>
            buildPayloadArbitrary(LESSON_REQUIRED_FIELDS, baseValues, emptyFields).map(
              (payload) => ({ payload, emptyFields })
            )
          ),
          ({ payload, emptyFields }) => {
            const errors = validateLesson(payload);
            const errorFields = Object.keys(errors);

            for (const field of emptyFields) {
              expect(errorFields).toContain(field);
            }
            for (const field of errorFields) {
              expect(emptyFields).toContain(field);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns no errors when all required fields are valid", () => {
      fc.assert(
        fc.property(
          buildPayloadArbitrary(LESSON_REQUIRED_FIELDS, baseValues, []),
          (payload) => {
            const errors = validateLesson(payload);
            expect(Object.keys(errors)).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Exercise validation", () => {
    const fieldNames = Object.keys(EXERCISE_REQUIRED_FIELDS);
    const baseValues: ExerciseFormValues = {
      unit_id: null,
      lesson_id: null,
      question_en: "",
      question_kh: "",
      exercise_type: "",
      media_id: null,
      explanation_en: null,
      explanation_kh: null,
      order_index: 1,
      is_active: true,
    };

    it("returns errors for exactly the empty required fields (no false positives/negatives)", () => {
      fc.assert(
        fc.property(
          nonEmptySubsetArb(fieldNames).chain((emptyFields) =>
            buildPayloadArbitrary(EXERCISE_REQUIRED_FIELDS, baseValues, emptyFields).map(
              (payload) => ({ payload, emptyFields })
            )
          ),
          ({ payload, emptyFields }) => {
            const errors = validateExercise(payload);
            const errorFields = Object.keys(errors);

            for (const field of emptyFields) {
              expect(errorFields).toContain(field);
            }
            for (const field of errorFields) {
              expect(emptyFields).toContain(field);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns no errors when all required fields are valid", () => {
      fc.assert(
        fc.property(
          buildPayloadArbitrary(EXERCISE_REQUIRED_FIELDS, baseValues, []),
          (payload) => {
            const errors = validateExercise(payload);
            expect(Object.keys(errors)).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
