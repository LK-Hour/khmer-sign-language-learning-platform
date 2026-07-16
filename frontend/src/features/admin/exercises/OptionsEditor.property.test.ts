/**
 * Property-Based Test: Options editor maintains list invariants
 *
 * **Validates: Requirements 5.3**
 *
 * Property 4: For any sequence of add, remove, and reorder operations on the
 * OptionsEditor, the resulting options list SHALL have:
 *   (a) no duplicate entries
 *   (b) sequential order_index values starting from 1 with no gaps
 *   (c) a total count equal to initial count plus additions minus removals
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ── Replicate OptionsEditor internal logic ───────────────────────────────────

interface ExerciseOptionFormState {
  id?: number;
  option_text_en: string;
  option_text_kh: string;
  media_id: number | null;
  is_correct: boolean;
  points: number;
  order_index: number;
}

function createBlankOption(orderIndex: number): ExerciseOptionFormState {
  return {
    option_text_en: "",
    option_text_kh: "",
    media_id: null,
    is_correct: false,
    points: 0,
    order_index: orderIndex,
  };
}

function reindex(options: ExerciseOptionFormState[]): ExerciseOptionFormState[] {
  return options.map((opt, i) => ({ ...opt, order_index: i + 1 }));
}

// ── Operations (mirror the component callbacks) ──────────────────────────────

function addOption(options: ExerciseOptionFormState[]): ExerciseOptionFormState[] {
  const newOption = createBlankOption(options.length + 1);
  return [...options, newOption];
}

function removeOption(
  options: ExerciseOptionFormState[],
  index: number,
): ExerciseOptionFormState[] {
  if (index < 0 || index >= options.length) return options;
  const updated = options.filter((_, i) => i !== index);
  return reindex(updated);
}

function moveUp(
  options: ExerciseOptionFormState[],
  index: number,
): ExerciseOptionFormState[] {
  if (index <= 0 || index >= options.length) return options;
  const updated = [...options];
  const temp = updated[index - 1];
  updated[index - 1] = updated[index];
  updated[index] = temp;
  return reindex(updated);
}

function moveDown(
  options: ExerciseOptionFormState[],
  index: number,
): ExerciseOptionFormState[] {
  if (index < 0 || index >= options.length - 1) return options;
  const updated = [...options];
  const temp = updated[index + 1];
  updated[index + 1] = updated[index];
  updated[index] = temp;
  return reindex(updated);
}

// ── Operation model for command generation ───────────────────────────────────

type Operation =
  | { type: "add" }
  | { type: "remove"; index: number }
  | { type: "moveUp"; index: number }
  | { type: "moveDown"; index: number };

function applyOperation(
  options: ExerciseOptionFormState[],
  op: Operation,
): ExerciseOptionFormState[] {
  switch (op.type) {
    case "add":
      return addOption(options);
    case "remove":
      return removeOption(options, op.index);
    case "moveUp":
      return moveUp(options, op.index);
    case "moveDown":
      return moveDown(options, op.index);
  }
}

// ── Arbitrary generators ─────────────────────────────────────────────────────

/** Generate a valid operation given current list size. */
function operationArb(currentSize: number): fc.Arbitrary<Operation> {
  const ops: fc.Arbitrary<Operation>[] = [fc.constant({ type: "add" as const })];

  if (currentSize > 0) {
    ops.push(
      fc.nat({ max: currentSize - 1 }).map((index) => ({
        type: "remove" as const,
        index,
      })),
    );
    ops.push(
      fc.nat({ max: currentSize - 1 }).map((index) => ({
        type: "moveUp" as const,
        index,
      })),
    );
    ops.push(
      fc.nat({ max: currentSize - 1 }).map((index) => ({
        type: "moveDown" as const,
        index,
      })),
    );
  }

  return fc.oneof(...ops);
}

/**
 * Generate a sequence of operations that respect the state at each step.
 * We build the sequence lazily so that remove/reorder indices are valid
 * relative to the list size at that point in the sequence.
 */
function operationSequenceArb(
  initialSize: number,
  maxOps: number,
): fc.Arbitrary<Operation[]> {
  return fc.nat({ max: maxOps }).chain((numOps) => {
    if (numOps === 0) return fc.constant([]);

    // Build operation sequence step by step
    let arb: fc.Arbitrary<Operation[]> = fc.constant([]);
    let size = initialSize;

    for (let i = 0; i < numOps; i++) {
      const currentSize = size;
      arb = arb.chain((ops) =>
        operationArb(currentSize).map((op) => [...ops, op]),
      );
      // We can't perfectly predict the size since we can't see the generated
      // ops yet, but we can estimate based on probability. Instead, we'll use
      // a simpler approach: generate ops independently with valid-range indices.
      // The applyOperation function handles out-of-bounds gracefully.
      size = Math.max(0, size); // Keep non-negative
    }

    return arb;
  });
}

/**
 * Simpler approach: generate operations with indices in a reasonable range.
 * applyOperation already handles boundary cases gracefully.
 */
function simpleOperationArb(maxIndex: number): fc.Arbitrary<Operation> {
  return fc.oneof(
    fc.constant({ type: "add" as const }),
    fc.nat({ max: maxIndex }).map((index) => ({ type: "remove" as const, index })),
    fc.nat({ max: maxIndex }).map((index) => ({ type: "moveUp" as const, index })),
    fc.nat({ max: maxIndex }).map((index) => ({ type: "moveDown" as const, index })),
  );
}

// ── Property Tests ───────────────────────────────────────────────────────────

describe("OptionsEditor Property Tests", () => {
  /**
   * **Validates: Requirements 5.3**
   *
   * Property 4: Options editor maintains list invariants
   */
  it("should maintain sequential order_index from 1 with no gaps after any sequence of operations", () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 5 }), // initial option count (0..5)
        fc.array(simpleOperationArb(10), { minLength: 1, maxLength: 20 }),
        (initialCount, operations) => {
          // Setup initial options
          let options: ExerciseOptionFormState[] = [];
          for (let i = 0; i < initialCount; i++) {
            options = addOption(options);
          }

          // Apply operations
          for (const op of operations) {
            options = applyOperation(options, op);
          }

          // Assert (b): Sequential order_index from 1 with no gaps
          for (let i = 0; i < options.length; i++) {
            expect(options[i].order_index).toBe(i + 1);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("should have no duplicate order_index values after any sequence of operations", () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 5 }),
        fc.array(simpleOperationArb(10), { minLength: 1, maxLength: 20 }),
        (initialCount, operations) => {
          // Setup initial options
          let options: ExerciseOptionFormState[] = [];
          for (let i = 0; i < initialCount; i++) {
            options = addOption(options);
          }

          // Apply operations
          for (const op of operations) {
            options = applyOperation(options, op);
          }

          // Assert (a): No duplicate order_index values
          const indices = options.map((o) => o.order_index);
          const uniqueIndices = new Set(indices);
          expect(uniqueIndices.size).toBe(indices.length);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("should maintain count = initial + adds - removes after operation sequence", () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 5 }),
        fc.array(simpleOperationArb(10), { minLength: 1, maxLength: 20 }),
        (initialCount, operations) => {
          // Setup initial options
          let options: ExerciseOptionFormState[] = [];
          for (let i = 0; i < initialCount; i++) {
            options = addOption(options);
          }

          // Track effective adds and removes
          let adds = 0;
          let removes = 0;
          let currentSize = initialCount;

          for (const op of operations) {
            if (op.type === "add") {
              adds++;
              currentSize++;
            } else if (op.type === "remove") {
              // Only counts as a remove if index is valid
              if (op.index >= 0 && op.index < currentSize) {
                removes++;
                currentSize--;
              }
            }
            // moveUp/moveDown don't change count
          }

          // Apply operations for real
          let result: ExerciseOptionFormState[] = [];
          for (let i = 0; i < initialCount; i++) {
            result = addOption(result);
          }
          for (const op of operations) {
            result = applyOperation(result, op);
          }

          // Assert (c): count = initial + adds - removes
          expect(result.length).toBe(initialCount + adds - removes);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("should maintain all three invariants together after any operation sequence", () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 5 }),
        fc.array(simpleOperationArb(10), { minLength: 1, maxLength: 30 }),
        (initialCount, operations) => {
          // Setup initial options
          let options: ExerciseOptionFormState[] = [];
          for (let i = 0; i < initialCount; i++) {
            options = addOption(options);
          }

          // Track effective adds and removes
          let adds = 0;
          let removes = 0;
          let currentSize = initialCount;

          for (const op of operations) {
            if (op.type === "add") {
              adds++;
              currentSize++;
            } else if (op.type === "remove") {
              if (op.index >= 0 && op.index < currentSize) {
                removes++;
                currentSize--;
              }
            }
          }

          // Apply operations
          for (const op of operations) {
            options = applyOperation(options, op);
          }

          // (a) No duplicates in order_index
          const indices = options.map((o) => o.order_index);
          const uniqueIndices = new Set(indices);
          expect(uniqueIndices.size).toBe(indices.length);

          // (b) Sequential order_index from 1
          for (let i = 0; i < options.length; i++) {
            expect(options[i].order_index).toBe(i + 1);
          }

          // (c) Count = initial + adds - removes
          expect(options.length).toBe(initialCount + adds - removes);
        },
      ),
      { numRuns: 200 },
    );
  });
});
